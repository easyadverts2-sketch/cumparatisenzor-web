import { prepareCardCheckout } from "@/lib/store";
import {
  euHostAllowed,
  formatEuAddress,
  parseEuCountry,
  parsePaymentMethod,
  parseShippingCarrier,
  toSafe,
  validateEuAddress,
} from "@/lib/eu-order-api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const host = request.headers.get("host") || "";
    const origin = request.headers.get("origin") || "";
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ ok: false, message: "Недопустимый источник запроса." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ ok: false, message: "Неверный источник запроса." }, { status: 403 });
      }
    }
    if (!euHostAllowed(host)) {
      return NextResponse.json(
        { ok: false, message: "Этот API доступен только для kupitsensor.eu." },
        { status: 400 }
      );
    }

    try {
      const limited = await enforceRateLimit({
        request,
        action: "api_orders_card_prepare_eu",
        limit: 12,
        windowSec: 60,
      });
      if (!limited.ok) {
        return NextResponse.json(
          { ok: false, message: "Слишком много попыток. Попробуйте позже." },
          { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
        );
      }
    } catch {
      // fail-open
    }

    const body = await request.json();
    if (parsePaymentMethod(body.paymentMethod) !== "CARD_STRIPE") {
      return NextResponse.json({ ok: false, message: "Этот endpoint только для оплаты картой." }, { status: 400 });
    }
    const shippingCarrierParsed = parseShippingCarrier(body.shippingCarrier);
    if (!shippingCarrierParsed) {
      return NextResponse.json({ ok: false, message: "Неверный способ доставки." }, { status: 400 });
    }

    const customerName = toSafe(body.customerName);
    const email = toSafe(body.email);
    const phone = toSafe(body.phone).replace(/\s+/g, "");
    const quantity = Number(body.quantity || 1);
    const additionalNotes = toSafe(body.additionalNotes).slice(0, 1000);
    const deliveryCountry = parseEuCountry(body.delivery?.country);
    const billingCountry = parseEuCountry(body.billing?.country) || deliveryCountry;
    if (!deliveryCountry) {
      return NextResponse.json({ ok: false, message: "Выберите страну доставки (DE, PL или AT)." }, { status: 400 });
    }

    const delivery = {
      street: toSafe(body.delivery?.street),
      city: toSafe(body.delivery?.city),
      postalCode: toSafe(body.delivery?.postalCode),
      country: deliveryCountry,
    };
    const billingDifferent = Boolean(body.billing?.different);
    const billing = {
      street: toSafe(body.billing?.street),
      city: toSafe(body.billing?.city),
      postalCode: toSafe(body.billing?.postalCode),
      country: billingCountry || deliveryCountry,
    };
    const billingCompanyName = toSafe(body.billing?.companyName);
    const billingTaxId = toSafe(body.billing?.taxId);
    const billingTradeRegNo = toSafe(body.billing?.tradeRegNo);

    if (customerName.split(/\s+/).length < 2) {
      return NextResponse.json({ ok: false, message: "Укажите полное имя." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, message: "Неверный e-mail." }, { status: 400 });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "Неверный номер телефона." }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ ok: false, message: "Неверное количество." }, { status: 400 });
    }

    const deliveryErr = validateEuAddress(delivery);
    if (deliveryErr) {
      return NextResponse.json({ ok: false, message: `Адрес доставки: ${deliveryErr}` }, { status: 400 });
    }

    if (billingDifferent) {
      if (!billingCompanyName || !billingTaxId || !billingTradeRegNo) {
        return NextResponse.json(
          { ok: false, message: "Для отдельного счёта укажите компанию, налоговый номер и рег. номер." },
          { status: 400 }
        );
      }
      const billingErr = validateEuAddress(billing);
      if (billingErr) {
        return NextResponse.json({ ok: false, message: `Адрес для счёта: ${billingErr}` }, { status: 400 });
      }
    }

    const deliveryAddress = [`Получатель: ${customerName}`, formatEuAddress(delivery)].join("\n");
    const billingAddress = billingDifferent
      ? [
          `Компания: ${billingCompanyName}`,
          `Налоговый номер: ${billingTaxId}`,
          `Рег. номер: ${billingTradeRegNo}`,
          formatEuAddress(billing),
        ].join("\n")
      : [`Физ. лицо: ${customerName}`, formatEuAddress(delivery)].join("\n");

    const result = await prepareCardCheckout(
      {
        customerName,
        email,
        phone,
        billingAddress,
        deliveryAddress,
        quantity,
        paymentMethod: "CARD_STRIPE",
        shippingCarrier: shippingCarrierParsed,
        shippingCarrierOther: null,
        additionalNotes,
      },
      "EU"
    );

    if (result.ok) {
      return NextResponse.json(
        { ok: true, pendingId: result.pendingId, paymentIntentId: result.paymentIntentId },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Ошибка сервера. Попробуйте снова." }, { status: 500 });
  }
}
