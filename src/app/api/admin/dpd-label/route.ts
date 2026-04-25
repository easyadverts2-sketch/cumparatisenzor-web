import { isAdminRequest } from "@/lib/admin-guard";
import { resolveDpdLabelDownload } from "@/lib/dpd-label-route";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim();
  const debug = String(request.nextUrl.searchParams.get("debug") || "").trim() === "1";
  if (!orderId) return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  return resolveDpdLabelDownload(orderId, "RO", debug);
}
