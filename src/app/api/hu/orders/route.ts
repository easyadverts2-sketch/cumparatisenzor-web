import { createOrder } from "@/lib/store";
import { enforceRateLimit } from "@/lib/rate-limit";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";
import type { Order } from "@/lib/types";
import { NextResponse } from "next/server";

function parsePaymentMethod(raw: unknown): Order["paymentMethod"] {
  const s = String(raw || "");
  if (s === "CARD_STRIPE") return "CARD_STRIPE";
  if (s === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (s === "COD") return "COD";
  return "COD";
}

function parseShippingCarrier(raw: unknown): ShippingCarrier | null {
  const s = String(raw || "").toUpperCase();
  if (s === "PACKETA") return "DPD";
  if ((SHIPPING_CARRIERS as readonly string[]).includes(s)) {
    return s as ShippingCarrier;
  }
  return null;
}

type AddressPayload = {
  street: string;
  city: string;
  postalCode: string;
  county: string;
  country?: string;
};

function toSafe(v: unknown): string {
  return String(v || "").trim();
}

function validateAddress(addr: AddressPayload): string | null {
  if (addr.street.length < 5) return "Az utca mezot pontositsd.";
  if (addr.city.length < 2) return "A varos kotelezo.";
  if (!/^\d{4}$/.test(addr.postalCode)) return "Az iranyitoszam 4 szamjegy legyen.";
  if (addr.county.length < 2) return "A megye kotelezo.";
  return null;
}

function formatAddress(addr: AddressPayload): string {
  return `${addr.street}, ${addr.city}, ${addr.postalCode}, ${addr.county}, Magyarorszag`;
}

export async function POST(request: Request) {
  try {
    const host = request.headers.get("host") || "";
    const origin = request.headers.get("origin") || "";
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ ok: false, message: "Nem engedelyezett keresi eredet." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ ok: false, message: "Ervenytelen keresi eredet." }, { status: 403 });
      }
    }
    if (!host.includes("szenzorvasarlas.hu")) {
      return NextResponse.json(
        { ok: false, message: "Ervenytelen HU vegpont ehhez a domainhez." },
        { status: 400 }
      );
    }

    try {
      const limited = await enforceRateLimit({
        request,
        action: "api_orders_create_hu",
        limit: 12,
        windowSec: 60,
      });
      if (!limited.ok) {
        return NextResponse.json(
          { ok: false, message: "Tul sok probalkozas. Probald ujra kicsit kesobb." },
          { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
        );
      }
    } catch {
      // Fail-open: ordering flow must continue even if rate-limit storage is temporarily unavailable.
    }

    const body = await request.json();
    const shippingCarrierParsed = parseShippingCarrier(body.shippingCarrier);
    if (!shippingCarrierParsed) {
      return NextResponse.json({ ok: false, message: "Ervenytelen szallitasi mod." }, { status: 400 });
    }
    const shippingCarrier = shippingCarrierParsed;
    if (!["COD", "BANK_TRANSFER", "CARD_STRIPE"].includes(String(body.paymentMethod || ""))) {
      return NextResponse.json({ ok: false, message: "Ervenytelen fizetesi mod." }, { status: 400 });
    }
    const customerName = toSafe(body.customerName);
    const email = toSafe(body.email);
    const phone = toSafe(body.phone).replace(/\s+/g, "");
    const quantity = Number(body.quantity || 1);
    const additionalNotes = toSafe(body.additionalNotes).slice(0, 1000);
    const delivery: AddressPayload = {
      street: toSafe(body.delivery?.street),
      city: toSafe(body.delivery?.city),
      postalCode: toSafe(body.delivery?.postalCode),
      county: toSafe(body.delivery?.county),
      country: "HU",
    };
    const billingDifferent = Boolean(body.billing?.different);
    const billing: AddressPayload = {
      street: toSafe(body.billing?.street),
      city: toSafe(body.billing?.city),
      postalCode: toSafe(body.billing?.postalCode),
      county: toSafe(body.billing?.county),
      country: "HU",
    };
    const billingCompanyName = toSafe(body.billing?.companyName);
    const billingTaxId = toSafe(body.billing?.taxId);
    const billingTradeRegNo = toSafe(body.billing?.tradeRegNo);

    if (customerName.split(/\s+/).length < 2) {
      return NextResponse.json({ ok: false, message: "Add meg a teljes nevet." }, { status: 400 });
    }
    if (customerName.length > 120) {
      return NextResponse.json({ ok: false, message: "A nev tul hosszu." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, message: "Ervenytelen e-mail cim." }, { status: 400 });
    }
    if (email.length > 160) {
      return NextResponse.json({ ok: false, message: "Az e-mail cim tul hosszu." }, { status: 400 });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "Ervenytelen telefonszam." }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ ok: false, message: "Ervenytelen darabszam." }, { status: 400 });
    }

    const deliveryErr = validateAddress(delivery);
    if (deliveryErr) {
      return NextResponse.json({ ok: false, message: `Hibas szallitasi cim: ${deliveryErr}` }, { status: 400 });
    }

    if (billingDifferent) {
      if (!billingCompanyName || !billingTaxId || !billingTradeRegNo) {
        return NextResponse.json(
          { ok: false, message: "Kulon szamlazashoz kotelezo a cegnev, adoszam es cegjegyzekszam." },
          { status: 400 }
        );
      }
      const billingErr = validateAddress(billing);
      if (billingErr) {
        return NextResponse.json(
          { ok: false, message: `Hibas szamlazasi cim: ${billingErr}` },
          { status: 400 }
        );
      }
    }

    const deliveryAddress = [`Cimzett: ${customerName}`, formatAddress(delivery)].join("\n");

    const billingAddress = billingDifferent
      ? [
          `Ceg: ${billingCompanyName}`,
          `Adoszam: ${billingTaxId}`,
          `Cegjegyzekszam: ${billingTradeRegNo}`,
          formatAddress(billing),
        ].join("\n")
      : [`Maganszemely: ${customerName}`, formatAddress(delivery)].join("\n");

    if (shippingCarrier === "DPD" && parsePaymentMethod(body.paymentMethod) === "COD") {
      return NextResponse.json(
        { ok: false, message: "DPD + utanvet jelenleg nem elerheto Magyarorszagon." },
        { status: 400 }
      );
    }
    const result = await createOrder(
      {
        customerName,
        email,
        phone,
        billingAddress,
        deliveryAddress,
        quantity,
        paymentMethod: parsePaymentMethod(body.paymentMethod),
        shippingCarrier,
        shippingCarrierOther: null,
        additionalNotes,
      },
      "HU"
    );

    if (result.ok && result.order) {
      return NextResponse.json(
        {
          ok: true,
          message: result.message,
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          paymentMethod: result.order.paymentMethod,
        },
        { status: 200 }
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: "A rendeles jelenleg nem feldolgozhato. Kerlek probald ujra." },
        { status: 400 }
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Szerverhiba. Kerlek probald ujra." },
      { status: 500 }
    );
  }
}
