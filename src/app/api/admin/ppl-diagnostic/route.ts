import { isAdminRequest } from "@/lib/admin-guard";
import { getOrderById } from "@/lib/store";
import { fetchPplShipmentStatus } from "@/lib/ppl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const orderId = request.nextUrl.searchParams.get("orderId") || "";
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  }
  const order = await getOrderById(orderId, "RO");
  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  }
  const diagnostic: Record<string, unknown> = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    market: order.market,
    shippingCarrier: order.shippingCarrier,
    pplShipmentId: order.pplShipmentId,
    trackingNumberInDb: order.trackingNumber,
    pplStatusInDb: order.pplShipmentStatus,
    pplLabelPathInDb: order.pplLabelPath,
  };
  if (order.pplShipmentId) {
    const status = await fetchPplShipmentStatus(order.pplShipmentId);
    diagnostic.pplBatchFetch = status;
  }
  if (order.pplLabelPath && /^https?:\/\//i.test(order.pplLabelPath)) {
    try {
      const res = await fetch(order.pplLabelPath);
      diagnostic.labelFetch = {
        ok: res.ok,
        status: res.status,
        contentType: res.headers.get("content-type") || "",
        contentLength: res.headers.get("content-length") || "",
      };
    } catch (err) {
      diagnostic.labelFetch = { ok: false, error: String(err) };
    }
  }
  return NextResponse.json({ ok: true, diagnostic }, { status: 200 });
}
