import { isAdminRequest } from "@/lib/admin-guard";
import { getOrderByIdAnyMarket, hardDeleteOrderWithCarrierCancel } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const orderId = String((body as Record<string, unknown>).orderId || "").trim();
  if (!orderId) return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  const order = await getOrderByIdAnyMarket(orderId);
  const market = order?.market || "RO";
  const result = await hardDeleteOrderWithCarrierCancel(orderId, market);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
