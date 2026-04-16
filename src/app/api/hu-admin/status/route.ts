import { updateOrderStatus } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { isHuAdminRequest } from "@/lib/admin-guard";

export async function POST(request: NextRequest) {
  if (!isHuAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!ORDER_STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, message: "Hibas statusz" }, { status: 400 });
  }

  const ok = await updateOrderStatus(String(body.orderId), body.status, "HU");
  if (!ok) {
    return NextResponse.json({ ok: false, message: "Nem talalhato rendeles" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
