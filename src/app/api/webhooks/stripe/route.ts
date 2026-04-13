import { sendEmail } from "@/lib/email";
import { formatOrderNumber } from "@/lib/order-format";
import { getOrderById, updateOrderStatus } from "@/lib/store";
import { getStripe } from "@/lib/stripe-checkout";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json({ ok: false, message: "Webhook neconfigurat" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ received: true });
    }

    const order = await getOrderById(orderId);
    if (!order || order.paymentMethod !== "CARD_STRIPE" || order.status !== "ORDERED_NOT_PAID") {
      return NextResponse.json({ received: true });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    await updateOrderStatus(orderId, "ORDERED_PAID_NOT_SHIPPED");

    const nr = formatOrderNumber(order.orderNumber);
    await sendEmail({
      to: order.email,
      subject: `Plata confirmata — comanda ${nr}`,
      text: `Am inregistrat plata pentru comanda ${nr}. Expediem dupa procesare. Va multumim!`,
    }).catch(() => undefined);
  }

  return NextResponse.json({ received: true });
}
