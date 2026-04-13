import { updateOrderStatus } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  if (!ORDER_STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, message: "Status invalid" }, { status: 400 });
  }

  const ok = await updateOrderStatus(String(body.orderId), body.status);
  if (!ok) {
    return NextResponse.json({ ok: false, message: "Comanda nu exista" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
