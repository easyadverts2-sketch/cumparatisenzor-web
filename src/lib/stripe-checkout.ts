import Stripe from "stripe";
import type { Order } from "./types";
import { formatOrderNumber } from "./order-format";
import { getPublicSiteUrl } from "./site-url";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    return null;
  }
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function createStripeCheckoutSession(
  order: Order,
  appBaseUrl?: string
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) {
    return null;
  }
  const base = (appBaseUrl || getPublicSiteUrl()).replace(/\/$/, "");
  const nr = formatOrderNumber(order.orderNumber);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    line_items: [
      {
        price_data: {
          currency: "ron",
          product_data: {
            name: `Comandă ${nr} — FreeStyle Libre 2 Plus`,
            description: `Cantitate: ${order.quantity}`,
          },
          unit_amount: Math.round(Number(order.totalPrice) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${base}/comanda/plata-card/rezultat?nr=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/comanda?card_anulat=1`,
  });
  return session.url;
}
