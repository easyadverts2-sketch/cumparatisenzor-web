import { isHuAdminRequest } from "@/lib/admin-guard";
import { buildDpdAuthDiagnostics, fetchDpdLabelPdfForShipments } from "@/lib/dpd";
import { getOrderById, refreshDpdShipment } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isHuAdminRequest(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim();
  const debug = String(request.nextUrl.searchParams.get("debug") || "") === "1";
  if (!orderId) return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  await refreshDpdShipment(orderId, "HU").catch(() => undefined);
  const order = await getOrderById(orderId, "HU");
  if (!order) return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  let endpointAttemptResults: unknown = null;
  if (String(request.nextUrl.searchParams.get("labelProbe") || "") === "1" && order.dpdShipmentId) {
    const probe = await fetchDpdLabelPdfForShipments([order.dpdShipmentId]);
    endpointAttemptResults = probe.ok ? probe.data.attempt : probe.raw;
  }
  return NextResponse.json(
    {
      ok: true,
      diagnostic: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        market: order.market,
        shippingCarrier: order.shippingCarrier,
        dpdShipmentId: order.dpdShipmentId,
        trackingNumber: order.trackingNumber,
        dpdStatusInDb: order.dpdShipmentStatus,
        dpdLastHttpStatus: order.dpdLastHttpStatus,
        dpdLastError: order.dpdLastError,
        rawCreateRequest: order.dpdRawCreateRequest,
        rawCreateResponse: order.dpdRawCreateResponse,
        rawStatusResponse: order.dpdRawStatusResponse,
        rawLabelResponse: order.dpdRawLabelResponse,
        rawCancelResponse: order.dpdRawCancelResponse,
        endpointAttemptResults,
        selectedTrackingCandidate: order.trackingNumber ? { source: order.dpdTrackingSource, value: order.trackingNumber } : null,
        rejectedTrackingCandidates: [],
        cacheVsLive: {
          dbStatus: order.dpdShipmentStatus,
          dbTracking: order.trackingNumber,
        },
        authDiagnostics: debug
          ? {
              createShipment: buildDpdAuthDiagnostics({ endpointPath: "/v1.1/shipments", method: "POST", responseStatus: order.dpdLastHttpStatus ?? null, responseBodySafe: order.dpdRawCreateResponse }),
              statusSync: buildDpdAuthDiagnostics({ endpointPath: "/v1.1/shipments/{id}", method: "GET", responseStatus: order.dpdLastHttpStatus ?? null, responseBodySafe: order.dpdRawStatusResponse }),
              labelByShipmentIds: buildDpdAuthDiagnostics({ endpointPath: "/v1.0/label/shipment-ids", method: "POST", responseStatus: null }),
            }
          : undefined,
        lastSyncAt: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}
