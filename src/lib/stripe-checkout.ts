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
  return order.market === "HU" ? 700 : 4;
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
  const currency = order.market === "HU" ? "huf" : "ron";
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: order.email,
      // Keep the checkout deterministic for both markets.
      // `automatic_payment_methods` can fail for some account/currency combinations
      // before the Payment Element is even rendered (most visible on HU/HUF flows).
      payment_method_types: ["card"],
      metadata: {
        orderId: order.id,
        orderNumber: String(order.orderNumber),
        market: order.market || "RO",
      },
      description: `Comanda ${order.orderNumber} - FreeStyle Libre 2 Plus`,
    });
  } catch (error) {
    const detail = String(error instanceof Error ? error.message : error).slice(0, 400);
    throw new Error(
      `Stripe PI create failed (market=${order.market}, currency=${currency}, amount=${amount}, orderId=${order.id}): ${detail}`
    );
  }
  if (!intent.client_secret) {
    return null;
  }
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
