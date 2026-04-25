import { isAdminRequest } from "@/lib/admin-guard";
import { debugFindPplTrackingNumber } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = String(body.orderId || "").trim();
  const knownTrackingNumber = String(body.knownTrackingNumber || "21491971453").trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  }
  const result = await debugFindPplTrackingNumber(orderId, knownTrackingNumber, "RO");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
