import Stripe from "stripe";
import type { Order } from "./types";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    return null;
  }
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

function marketMinimumTotal(order: Order): number {
  // Keep a safety buffer because Stripe also enforces minimums after
  // conversion to the account settlement currency (CZK in this setup).
  return order.market === "HU" ? 300 : 4;
}

export async function createStripePaymentIntent(
  order: Order,
  _appBaseUrl?: string
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return null;
  }
  const minimum = marketMinimumTotal(order);
  if (Number(order.totalPrice) < minimum) {
    throw new Error(
      order.market === "HU"
        ? `Stripe minimum charge for HUF is ${minimum}.`
        : `Stripe minimum charge for RON is ${minimum}.`
    );
  }
  const amount =
    order.market === "HU"
      ? Math.round(Number(order.totalPrice)) // HUF is zero-decimal currency in Stripe
      : Math.round(Number(order.totalPrice) * 100); // RON uses cents (bani)
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: order.market === "HU" ? "huf" : "ron",
    receipt_email: order.email,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order.id,
      orderNumber: String(order.orderNumber),
      market: order.market || "RO",
    },
    description: `Comanda ${order.orderNumber} - FreeStyle Libre 2 Plus`,
  });
  if (!intent.client_secret) {
    return null;
  }
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
