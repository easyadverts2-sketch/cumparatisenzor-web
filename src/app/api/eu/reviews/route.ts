import { sendEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

type ReviewPayload = {
  name?: unknown;
  email?: unknown;
  rating?: unknown;
  text?: unknown;
  locale?: unknown;
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

function isEuHost(host: string) {
  const h = host.toLowerCase();
  return h.includes("kupitsensor.eu") || h.includes("localhost");
}

export async function POST(request: Request) {
  try {
    const host = request.headers.get("host") || "";
    const origin = request.headers.get("origin") || "";
    if (!isEuHost(host)) {
      return NextResponse.json({ ok: false, message: "Not available." }, { status: 403 });
    }
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

    try {
      const limited = await enforceRateLimit({
        request,
        action: "api_eu_review_submit",
        limit: 5,
        windowSec: 600,
      });
      if (!limited.ok) {
        return NextResponse.json(
          { ok: false, message: "Слишком много попыток. Попробуйте позже." },
          { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
        );
      }
    } catch {
      // Fail-open if rate-limit storage is temporarily unavailable.
    }

    const body = (await request.json()) as ReviewPayload;
    const name = toSafe(body.name);
    const email = toSafe(body.email);
    const text = toSafe(body.text);
    const locale = toSafe(body.locale) === "uk" ? "uk" : "ru";
    const website = toSafe(body.website);
    const rating = Number(body.rating);

    if (website) {
      return NextResponse.json({ ok: true });
    }
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { ok: false, message: locale === "uk" ? "Вкажіть ім’я." : "Укажите имя." },
        { status: 400 }
      );
    }
    if (!email.includes("@") || email.length > 160) {
      return NextResponse.json(
        { ok: false, message: locale === "uk" ? "Некоректний e-mail." : "Некорректный e-mail." },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, message: locale === "uk" ? "Оберіть оцінку 1–5." : "Выберите оценку 1–5." },
        { status: 400 }
      );
    }
    if (text.length < 20 || text.length > 2000) {
      return NextResponse.json(
        {
          ok: false,
          message:
            locale === "uk"
              ? "Відгук має бути від 20 до 2000 символів."
              : "Отзыв должен быть от 20 до 2000 символов.",
        },
        { status: 400 }
      );
    }

    const recipient =
      process.env.INTERNAL_ORDER_EMAIL_EU ||
      process.env.INTERNAL_ORDER_EMAIL_OPERATOR ||
      "info@kupitsensor.eu";
    const from = process.env.SMTP_FROM_EU || "info@kupitsensor.eu";
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    const subject = `Отзыв kupitsensor.eu (${rating}/5) — ${name}`;
    const plain = [
      `Сайт: kupitsensor.eu`,
      `Язык формы: ${locale}`,
      `Имя: ${name}`,
      `E-mail: ${email}`,
      `Оценка: ${rating}/5 ${stars}`,
      "",
      "Текст отзыва:",
      text,
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;">
        <h2>Новый отзыв — kupitsensor.eu</h2>
        <p><strong>Язык:</strong> ${locale}</p>
        <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Оценка:</strong> ${rating}/5 ${stars}</p>
        <div style="margin-top:12px;padding:12px;border:1px solid #eadce4;border-radius:12px;white-space:pre-line;">
          ${escapeHtml(text)}
        </div>
      </div>
    `;

    const result = await sendEmail({ to: recipient, subject, text: plain, html, from });
    if (!result.sent) {
      return NextResponse.json(
        {
          ok: false,
          message:
            locale === "uk"
              ? "Не вдалося надіслати відгук. Спробуйте пізніше."
              : "Не удалось отправить отзыв. Попробуйте позже.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
