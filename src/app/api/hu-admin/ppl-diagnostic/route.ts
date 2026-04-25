import { isHuAdminRequest } from "@/lib/admin-guard";
import { debugFindPplTrackingNumber, getOrderById, syncPplBatch } from "@/lib/store";
import { fetchPplBatchStatus, fetchPplOrderInfoByCustomerReference, fetchPplShipmentInfoByNumber } from "@/lib/ppl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isHuAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const orderId = request.nextUrl.searchParams.get("orderId") || "";
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  }
  const order = await getOrderById(orderId, "HU");
  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  }
  await syncPplBatch(orderId, "HU").catch(() => undefined);
  const knownTrackingNumber = String(request.nextUrl.searchParams.get("knownTrackingNumber") || "21491971453").trim();
  const debugSearch = await debugFindPplTrackingNumber(orderId, knownTrackingNumber, "HU").catch(() => null);
  const refreshed = (await getOrderById(orderId, "HU")) || order;
  const diagnostic: Record<string, unknown> = {
    orderId: refreshed.id,
    orderNumber: refreshed.orderNumber,
    market: refreshed.market,
    shippingCarrier: refreshed.shippingCarrier,
    pplShipmentId: refreshed.pplShipmentId,
    pplBatchId: refreshed.pplBatchId,
    pplOrderReference: refreshed.pplOrderReference,
    pplOrderNumber: refreshed.pplOrderNumber,
    pplImportState: refreshed.pplImportState,
    pplShipmentState: refreshed.pplShipmentState,
    pplLastHttpStatus: refreshed.pplLastHttpStatus,
    pplLastError: refreshed.pplLastError,
    trackingNumberInDb: refreshed.trackingNumber,
    pplStatusInDb: refreshed.pplShipmentStatus,
    pplLabelPathInDb: refreshed.pplLabelPath,
    rawCreateRequest: refreshed.pplRawCreateRequest,
    rawCreateResponse: refreshed.pplRawCreateResponse,
    locationHeader: refreshed.pplLocationHeader,
    rawBatchStatusResponse: refreshed.pplRawBatchStatusResponse,
    rawLabelResponse: refreshed.pplRawLabelResponse,
    rawOrderResponse: refreshed.pplRawOrderResponse,
    rawShipmentResponse: refreshed.pplRawShipmentResponse,
  };
  if (refreshed.pplBatchId) {
    const status = await fetchPplBatchStatus(refreshed.pplBatchId);
    diagnostic.pplBatchFetch = status;
  }
  if (refreshed.pplShipmentId) {
    diagnostic.pplShipmentFetch = await fetchPplShipmentInfoByNumber(refreshed.pplShipmentId);
  }
  diagnostic.pplOrderFetch = await fetchPplOrderInfoByCustomerReference(String(refreshed.orderNumber));
  if (refreshed.pplLabelPath && /^https?:\/\//i.test(refreshed.pplLabelPath)) {
    try {
      const res = await fetch(refreshed.pplLabelPath);
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
  if (debugSearch) {
    diagnostic.knownTrackingNumberSearch = {
      knownTrackingNumber: debugSearch.knownTrackingNumber,
      found: debugSearch.found,
      saved: debugSearch.saved,
      matches: debugSearch.matches,
    };
    diagnostic.trackingNumberCandidates = debugSearch.trackingNumberCandidates;
    diagnostic.debugRequests = debugSearch.requests;
  }
  return NextResponse.json({ ok: true, diagnostic }, { status: 200 });
}
