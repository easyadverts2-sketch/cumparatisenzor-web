import { sendEmail } from "@/lib/email";
import { buildPaymentReceivedEmail } from "@/lib/order-emails";
import { getSql } from "@/lib/db";
import { getOrderById, updateOrderStatus } from "@/lib/store";
import { getStripe } from "@/lib/stripe-checkout";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

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
  const orderId = intent.metadata?.orderId;
  const market = intent.metadata?.market === "HU" ? "HU" : "RO";
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
  if (inserted.length === 0) {
    return NextResponse.json({ received: true });
  }

  // Fast ACK pattern: return 2xx immediately after durable enqueue/dedupe.
  queueMicrotask(() => {
    void processStripeEvent(event).catch(async (err) => {
      const message = String(err instanceof Error ? err.message : err).slice(0, 2000);
      try {
        const sql = getSql();
        await sql`
          update stripe_webhook_events
          set status = 'FAILED', processed_at = now(), last_error = ${message}
          where event_id = ${event.id}
        `;
      } catch {
        // noop
      }
    });
  });

  return NextResponse.json({ received: true });
}
