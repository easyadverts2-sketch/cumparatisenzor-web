import { createStripePaymentIntent } from "@/lib/stripe-checkout";
import { getOrderById } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId || "");
    if (!orderId) {
      return NextResponse.json({ ok: false, message: "Lipseste orderId." }, { status: 400 });
    }

    const order = await getOrderById(orderId);
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

    const intent = await createStripePaymentIntent(order);
    if (!intent) {
      return NextResponse.json({ ok: false, message: "Plata card nu este configurata." }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Eroare server." }, { status: 500 });
  }
}
