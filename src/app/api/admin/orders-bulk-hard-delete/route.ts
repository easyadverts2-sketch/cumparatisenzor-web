import { isAdminRequest } from "@/lib/admin-guard";
import { hardDeleteOrdersBulk } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const orderIds = Array.isArray((body as Record<string, unknown>).orderIds) ? ((body as Record<string, unknown>).orderIds as unknown[]) : [];
  const result = await hardDeleteOrdersBulk(orderIds.map((x) => String(x || "")), "RO");
  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}
