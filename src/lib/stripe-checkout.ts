import Stripe from "stripe";
import type { Order } from "./types";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    return null;
  }
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function createStripePaymentIntent(
  order: Order,
  _appBaseUrl?: string
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return null;
  }
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(Number(order.totalPrice) * 100),
    currency: "ron",
    receipt_email: order.email,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order.id,
      orderNumber: String(order.orderNumber),
    },
    description: `Comanda ${order.orderNumber} - FreeStyle Libre 2 Plus`,
  });
  if (!intent.client_secret) {
    return null;
  }
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
