import { getCardPaymentIntentOrderNumber, recoverPendingCardPayment } from "@/lib/store";
import { NextResponse } from "next/server";

/**
 * Idempotent backup: after Stripe shows payment succeeded, ensure the order exists.
 * Safe to call from the thank-you page or status polling — only works for real succeeded PIs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentIntentId = String(body.paymentIntentId || body.pi || "").trim();
    const pendingId = String(body.pendingId || "").trim();

    if (!paymentIntentId && !pendingId) {
      return NextResponse.json({ ok: false, message: "Missing paymentIntentId or pendingId." }, { status: 400 });
    }

    const pi = paymentIntentId || undefined;
    if (pi) {
      const existing = await getCardPaymentIntentOrderNumber(pi);
      if (existing.ok) {
        return NextResponse.json({
          ok: true,
          ready: true,
          orderNumber: existing.orderNumber,
          market: existing.market,
          source: "existing",
        });
      }
    }

    const recovered = await recoverPendingCardPayment({ pendingId, paymentIntentId: pi });
    if (!recovered.ok) {
      return NextResponse.json({ ok: false, ready: false, message: recovered.message }, { status: 200 });
    }

    return NextResponse.json({
      ok: true,
      ready: true,
      orderNumber: recovered.orderNumber,
      market: recovered.market,
      source: "recovered",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 });
  }
}
