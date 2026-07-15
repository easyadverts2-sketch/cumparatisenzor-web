import Stripe from "stripe";
import type { Market, Order } from "./types";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    return null;
  }
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

function stripeCurrencyForMarket(market: Market): "ron" | "huf" | "eur" {
  if (market === "HU") return "huf";
  if (market === "EU") return "eur";
  return "ron";
}

function marketMinimumTotal(market: Market, totalPrice?: number): number {
  if (market === "HU") return 250;
  if (market === "EU") return 0.5;
  return 4;
}

function minimumChargeErrorMessage(market: Market, minimum: number): string {
  if (market === "HU") return `Stripe minimum charge for HUF is ${minimum}.`;
  if (market === "EU") return `Stripe minimum charge for EUR is ${minimum}.`;
  return `Stripe minimum charge for RON is ${minimum}.`;
}

export async function createStripePaymentIntent(
  order: Order,
  _appBaseUrl?: string
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return null;
  }
  const market = order.market || "RO";
  const minimum = marketMinimumTotal(market);
  if (Number(order.totalPrice) < minimum) {
    throw new Error(minimumChargeErrorMessage(market, minimum));
  }
  const amount = stripeMinorAmountForTotal(market, Number(order.totalPrice));
  const currency = stripeCurrencyForMarket(market);
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: order.email,
      payment_method_types: ["card"],
      metadata: {
        orderId: order.id,
        orderNumber: String(order.orderNumber),
        market: order.market || "RO",
      },
      description: `Comanda ${order.orderNumber}`,
    });
  } catch (error) {
    const detail = String(error instanceof Error ? error.message : error).slice(0, 400);
    throw new Error(
      `Stripe PI create failed (market=${market}, currency=${currency}, amount=${amount}, orderId=${order.id}): ${detail}`
    );
  }
  if (!intent.client_secret) {
    return null;
  }
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

export function stripeMinorAmountForTotal(market: Market, totalPrice: number): number {
  return Math.round(Number(totalPrice) * 100);
}

export async function createStripePaymentIntentForPending(input: {
  market: Market;
  totalPrice: number;
  pendingCheckoutId: string;
  email: string;
}): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return null;
  }
  const minimum = marketMinimumTotal(input.market);
  if (Number(input.totalPrice) < minimum) {
    throw new Error(minimumChargeErrorMessage(input.market, minimum));
  }
  const amount = stripeMinorAmountForTotal(input.market, input.totalPrice);
  const currency = stripeCurrencyForMarket(input.market);
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: input.email,
      payment_method_types: ["card"],
      metadata: {
        pendingCheckoutId: input.pendingCheckoutId,
        market: input.market,
        totalMinor: String(amount),
      },
      description:
        input.market === "HU"
          ? "Kartyas fizetes - Szenzorvasarlas (varakozo)"
          : input.market === "EU"
            ? "Оплата картой — kupitsensor.eu (ожидание)"
            : "Plata card - Comanda (in asteptare)",
    });
  } catch (error) {
    const detail = String(error instanceof Error ? error.message : error).slice(0, 400);
    throw new Error(
      `Stripe PI create failed (market=${input.market}, currency=${currency}, amount=${amount}, pending=${input.pendingCheckoutId}): ${detail}`
    );
  }
  if (!intent.client_secret) {
    return null;
  }
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
