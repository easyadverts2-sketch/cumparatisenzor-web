import { sendEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  orderNumber?: unknown;
  website?: unknown;
};

function toSafe(input: unknown) {
  return String(input || "").trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function marketFromHost(host: string) {
  const h = host.toLowerCase();
  return h.includes("szenzorvasarlas.hu") ? "HU" : "RO";
}

export async function POST(request: Request) {
  try {
    const host = request.headers.get("host") || "";
    const origin = request.headers.get("origin") || "";
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ ok: false, message: "Request origin not allowed." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ ok: false, message: "Invalid request origin." }, { status: 403 });
      }
    }
    const market = marketFromHost(host);
    try {
      const limited = await enforceRateLimit({
        request,
        action: "api_contact_submit",
        limit: 5,
        windowSec: 300,
      });
      if (!limited.ok) {
        return NextResponse.json(
          {
            ok: false,
            message:
              market === "HU"
                ? "Tul sok probalkozas. Probald ujra nehany perc mulva."
                : "Prea multe incercari. Reincercati in cateva minute.",
          },
          { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
        );
      }
    } catch {
      // Fail-open if rate-limit storage is temporarily unavailable.
    }

    const body = (await request.json()) as ContactPayload;
    const name = toSafe(body.name);
    const email = toSafe(body.email);
    const phone = toSafe(body.phone);
    const message = toSafe(body.message);
    const orderNumber = toSafe(body.orderNumber);
    const website = toSafe(body.website);

    // Honeypot: bots usually fill hidden fields.
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (name.length < 2) {
      return NextResponse.json(
        { ok: false, message: market === "HU" ? "Add meg a nevedet." : "Introduceti numele." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: market === "HU" ? "Ervenytelen e-mail cim." : "E-mail invalid." },
        { status: 400 }
      );
    }
    if (message.length < 10) {
      return NextResponse.json(
        {
          ok: false,
          message:
            market === "HU"
              ? "Az uzenet legyen legalabb 10 karakter."
              : "Mesajul trebuie sa aiba minimum 10 caractere.",
        },
        { status: 400 }
      );
    }
    if (name.length > 120 || email.length > 160 || phone.length > 40 || orderNumber.length > 32 || message.length > 4000) {
      return NextResponse.json(
        {
          ok: false,
          message: market === "HU" ? "A megadott adatok tul hosszuak." : "Datele introduse sunt prea lungi.",
        },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "-");
    const safeOrderNumber = escapeHtml(orderNumber || "-");
    const safeMessage = escapeHtml(message);

    const recipient =
      market === "HU"
        ? process.env.INTERNAL_ORDER_EMAIL_HU || "info@szenzorvasarlas.hu"
        : process.env.INTERNAL_ORDER_EMAIL_RO || "info@cumparatisenzor.ro";
    const from = market === "HU" ? process.env.SMTP_FROM_HU : process.env.SMTP_FROM;
    const site = market === "HU" ? "szenzorvasarlas.hu" : "cumparatisenzor.ro";

    const subject = `Kontakt formular (${site}) - ${name}`;
    const text = [
      `Web: ${site}`,
      `Jméno: ${name}`,
      `E-mail: ${email}`,
      `Telefon: ${phone || "-"}`,
      `Číslo objednávky: ${orderNumber || "-"}`,
      "",
      "Zpráva:",
      message,
    ].join("\n");
    const html = `
      <div style="background:#f4f1f6;padding:24px 10px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #ead5df;border-radius:20px;overflow:hidden;box-shadow:0 15px 45px rgba(111,33,71,.17);">
          <div style="background:linear-gradient(135deg,#6f2147,#a22d53,#df5b42);padding:18px 22px;">
            <h1 style="margin:0;color:#fff;font-size:20px;">Nová zpráva z kontaktního formuláře</h1>
          </div>
          <div style="padding:22px;">
            <p><strong>Web:</strong> ${site}</p>
            <p><strong>Jméno:</strong> ${safeName}</p>
            <p><strong>E-mail:</strong> ${safeEmail}</p>
            <p><strong>Telefon:</strong> ${safePhone}</p>
            <p><strong>Číslo objednávky:</strong> ${safeOrderNumber}</p>
            <div style="margin-top:14px;padding:12px;border:1px solid #eadce4;border-radius:12px;background:#faf7fb;white-space:pre-line;">
              ${safeMessage}
            </div>
          </div>
        </div>
      </div>
    `;

    const sent = await sendEmail({ to: recipient, subject, text, html, from }).then(() => true).catch(() => false);
    if (!sent) {
      return NextResponse.json(
        {
          ok: false,
          message:
            market === "HU"
              ? "Most nem sikerult elkuldeni az uzenetet. Kerlek probald ujra."
              : "Mesajul nu a putut fi trimis momentan. Va rugam reincercati.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Server error. Va rugam sa incercati din nou." },
      { status: 500 }
    );
  }
}
