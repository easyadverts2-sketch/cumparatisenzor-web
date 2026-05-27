import { updateOrderStatus, getOrderByIdAnyMarket } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!ORDER_STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, message: "Status invalid" }, { status: 400 });
  }

  const orderId = String(body.orderId);
  const order = await getOrderByIdAnyMarket(orderId);
  const market = order?.market || "RO";
  const ok = await updateOrderStatus(orderId, body.status, market);
  if (!ok) {
    return NextResponse.json({ ok: false, message: "Comanda nu exista" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
