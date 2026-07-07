import { sendEmail } from "@/lib/email";
import { buildPaymentReceivedEmail } from "@/lib/order-emails";
import { getSql } from "@/lib/db";
import { finalizePendingCardPaymentFromStripe, getOrderById, updateOrderStatus } from "@/lib/store";
import { getStripe } from "@/lib/stripe-checkout";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

function expectedStripeCurrency(market: "RO" | "HU" | "EU"): "ron" | "huf" | "eur" {
  if (market === "HU") return "huf";
  if (market === "EU") return "eur";
  return "ron";
}

function expectedStripeAmount(order: { market?: "RO" | "HU" | "EU"; totalPrice: number }): number {
  // All currently used currencies are charged by Stripe in their minor units
  // (cents/bani/fillér). HUF on this account is configured to expect *100 as well.
  return Math.round(Number(order.totalPrice) * 100);
}

async function ensureWebhookEventTable() {
  const sql = getSql();
  await sql`
    create table if not exists stripe_webhook_events (
      event_id text unique not null,
      event_type text not null,
      status text not null default 'PROCESSING',
      created_at timestamptz not null default now(),
      processed_at timestamptz null,
      last_error text null
    )
  `;
}

function isAllowedWebhookIp(request: Request): boolean {
  const rawAllowlist = process.env.STRIPE_WEBHOOK_IP_ALLOWLIST?.trim() || "";
  if (!rawAllowlist) return true; // Optional hardening: enforce only when configured.
  const allowed = rawAllowlist
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const sourceIp = forwardedFor.split(",")[0]?.trim();
  if (!sourceIp) return false;
  return allowed.includes(sourceIp);
}

async function processStripeEvent(event: Stripe.Event) {
  if (event.type !== "payment_intent.succeeded") {
    const sql = getSql();
    await sql`
      update stripe_webhook_events
      set status = 'IGNORED', processed_at = now()
      where event_id = ${event.id}
    `;
    return;
  }

  const intent = event.data.object as Stripe.PaymentIntent;

  const pendingOutcome = await finalizePendingCardPaymentFromStripe(intent);
  if (pendingOutcome === "handled") {
    const sql = getSql();
    await sql`
      update stripe_webhook_events
      set status = 'PROCESSED', processed_at = now()
      where event_id = ${event.id}
    `;
    return;
  }

  const orderId = intent.metadata?.orderId;
  const rawMarket = intent.metadata?.market;
  const market: "RO" | "HU" | "EU" =
    rawMarket === "HU" ? "HU" : rawMarket === "EU" ? "EU" : "RO";
  if (!orderId || typeof orderId !== "string") {
    const sql = getSql();
    await sql`
      update stripe_webhook_events
      set status = 'IGNORED', processed_at = now(), last_error = 'missing_order_id'
      where event_id = ${event.id}
    `;
    return;
  }

  const order = await getOrderById(orderId, market);
  if (!order || order.paymentMethod !== "CARD_STRIPE" || order.status !== "ORDERED_NOT_PAID") {
    const sql = getSql();
    await sql`
      update stripe_webhook_events
      set status = 'IGNORED', processed_at = now(), last_error = 'order_not_processible'
      where event_id = ${event.id}
    `;
    return;
  }

  const expectedCurrency = expectedStripeCurrency(market);
  const receivedCurrency = String(intent.currency || "").toLowerCase();
  if (receivedCurrency !== expectedCurrency) {
    throw new Error(`stripe_currency_mismatch:${receivedCurrency}:${expectedCurrency}`);
  }
  const expectedAmount = expectedStripeAmount(order);
  const paidAmount = Number(intent.amount_received || intent.amount || 0);
  if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
    throw new Error(`stripe_amount_mismatch:${paidAmount}:${expectedAmount}`);
  }

  await updateOrderStatus(orderId, "ORDERED_PAID_NOT_SHIPPED", market);
  const refreshed = await getOrderById(orderId, market);
  const mailOrder = refreshed || order;
  const paymentMail = buildPaymentReceivedEmail(mailOrder, market);
  await sendEmail({
    to: mailOrder.email,
    subject: paymentMail.subject,
    text: paymentMail.text,
    html: paymentMail.html,
  }).catch(() => undefined);

  const sql = getSql();
  await sql`
    update stripe_webhook_events
    set status = 'PROCESSED', processed_at = now()
    where event_id = ${event.id}
  `;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json({ ok: false, message: "Webhook neconfigurat" }, { status: 503 });
  }
  if (!isAllowedWebhookIp(request)) {
    return NextResponse.json({ ok: false, message: "Forbidden source" }, { status: 403 });
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

  await ensureWebhookEventTable();
  const sql = getSql();
  const inserted = await sql<{ event_id: string }[]>`
    insert into stripe_webhook_events (event_id, event_type, status)
    values (${event.id}, ${event.type}, 'PROCESSING')
    on conflict (event_id) do nothing
    returning event_id
  `;
  let shouldProcess = inserted.length > 0;
  if (!shouldProcess) {
    const existing = await sql<{ status: string; created_at: string }[]>`
      select status, created_at
      from stripe_webhook_events
      where event_id = ${event.id}
      limit 1
    `;
    const row = existing[0];
    if (row) {
      const status = String(row.status || "").toUpperCase();
      const createdAt = new Date(row.created_at);
      const staleProcessing =
        status === "PROCESSING" &&
        Number.isFinite(createdAt.getTime()) &&
        Date.now() - createdAt.getTime() > 10 * 60 * 1000;
      if (status === "FAILED" || staleProcessing) {
        await sql`
          update stripe_webhook_events
          set status = 'PROCESSING', processed_at = null, last_error = null, created_at = now()
          where event_id = ${event.id}
        `;
        shouldProcess = true;
      }
    }
  }
  if (!shouldProcess) {
    return NextResponse.json({ received: true });
  }

  // Process synchronously before returning 2xx. On Vercel/serverless, queueMicrotask
  // often never runs after the response is sent, so orders were never created.
  try {
    await processStripeEvent(event);
  } catch (err) {
    const message = String(err instanceof Error ? err.message : err).slice(0, 2000);
    try {
      await sql`
        update stripe_webhook_events
        set status = 'FAILED', processed_at = now(), last_error = ${message}
        where event_id = ${event.id}
      `;
    } catch {
      // noop
    }
    console.error("[stripe-webhook] process failed", { eventId: event.id, message });
    return NextResponse.json({ ok: false, message: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
