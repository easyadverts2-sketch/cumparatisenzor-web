import { isAdminRequest } from "@/lib/admin-guard";
import {
  listFailedStripeWebhookEvents,
  listPendingCardCheckoutsForRecovery,
  recoverPendingCardPayment,
} from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const email = request.nextUrl.searchParams.get("email") || undefined;
  const [pending, failedWebhooks] = await Promise.all([
    listPendingCardCheckoutsForRecovery({ email, limit: 50 }),
    listFailedStripeWebhookEvents(20),
  ]);
  return NextResponse.json({ ok: true, pending, failedWebhooks });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const pendingId = String(body.pendingId || "").trim();
  const paymentIntentId = String(body.paymentIntentId || "").trim();
  if (!pendingId && !paymentIntentId) {
    return NextResponse.json({ ok: false, message: "Chybi pendingId nebo paymentIntentId." }, { status: 400 });
  }
  const result = await recoverPendingCardPayment({ pendingId, paymentIntentId });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
