import { createStripePaymentIntent } from "@/lib/stripe-checkout";
import { getOrderById, getPendingCardCheckoutIntentSecret } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let safeOrderId = "";
  let safePendingId = "";
  let safeMarket: "RO" | "HU" = "RO";
  try {
    const body = await request.json();
    const market = String(body.market || "RO").toUpperCase() === "HU" ? "HU" : "RO";
    safeMarket = market;
    const pendingId = String(body.pendingId || "").trim();
    const orderId = String(body.orderId || "").trim();

    if (pendingId) {
      safePendingId = pendingId;
      const pending = await getPendingCardCheckoutIntentSecret(pendingId, market);
      if (!pending.ok) {
        return NextResponse.json({ ok: false, message: pending.message }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        clientSecret: pending.clientSecret,
        paymentIntentId: pending.paymentIntentId,
        orderNumber: 0,
        totalPrice: pending.totalPrice,
        pendingCheckout: true,
      });
    }

    if (!orderId) {
      return NextResponse.json({ ok: false, message: "Lipseste orderId sau pendingId." }, { status: 400 });
    }
    safeOrderId = orderId;

    const order = await getOrderById(orderId, market);
    if (!order) {
      return NextResponse.json({ ok: false, message: "Comanda nu a fost gasita." }, { status: 404 });
    }
    if (order.paymentMethod !== "CARD_STRIPE") {
      return NextResponse.json({ ok: false, message: "Aceasta comanda nu este cu plata card." }, { status: 400 });
    }
    if (order.status !== "ORDERED_NOT_PAID") {
      return NextResponse.json(
        { ok: false, message: "Plata nu mai este disponibila pentru aceasta comanda." },
        { status: 400 }
      );
    }

    let intent;
    try {
      intent = await createStripePaymentIntent(order);
    } catch (error) {
      const detail = String(error instanceof Error ? error.message : error).slice(0, 500);
      console.error("[card-intent:create]", {
        market,
        orderId,
        orderNumber: order.orderNumber,
        detail,
      });
      return NextResponse.json(
        {
          ok: false,
          message: "Plata cu cardul nu poate fi initializata momentan.",
        },
        { status: 500 }
      );
    }
    if (!intent) {
      return NextResponse.json({ ok: false, message: "Plata card nu este configurata." }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      pendingCheckout: false,
    });
  } catch (error) {
    const detail = String(error instanceof Error ? error.message : error).slice(0, 500);
    console.error("[card-intent]", {
      market: safeMarket,
      orderId: safeOrderId,
      pendingId: safePendingId,
      detail,
    });
    return NextResponse.json(
      { ok: false, message: "Plata cu cardul nu poate fi initializata momentan." },
      { status: 500 }
    );
  }
}
