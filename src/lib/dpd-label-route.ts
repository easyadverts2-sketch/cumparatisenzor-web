import { fetchDpdLabelPdfForShipments, type DpdEndpointAttempt } from "./dpd";
import { getOrderById } from "./store";
import type { Market } from "./types";

export async function resolveDpdLabelDownload(
  orderId: string,
  market: Market,
  debug = false
): Promise<Response> {
  let step = "load_order";
  let lastAttempt: DpdEndpointAttempt | null = null;
  let labelErrorMessage: string | null = null;
  try {
    let order = await getOrderById(orderId, market);
    if (!order) return Response.json({ ok: false, step, reason: "order_not_found", orderId, market }, { status: 404 });

    const shipmentId = String(order.dpdShipmentId || "").trim();
    const tracking = String(order.trackingNumber || "").trim();
    const hasTracking = /^\d{10,14}$/.test(tracking);
    if (!shipmentId && !hasTracking) {
      return Response.json(
        {
          ok: false,
          step,
          reason: "missing_dpd_identifiers",
          orderId,
          market,
          hasTrackingNumber: Boolean(order.trackingNumber),
          dpdStatusInDb: order.dpdShipmentStatus || null,
          missing: {
            dpdShipmentId: !shipmentId,
            trackingNumber: !hasTracking,
          },
        },
        { status: 409 }
      );
    }

    step = "download_label";
    const label = await fetchDpdLabelPdfForShipments(
      hasTracking ? { parcelNumbers: [tracking] } : { shipmentIds: [shipmentId] }
    );
    if (label.ok) {
      lastAttempt = label.data.attempt;
      labelErrorMessage = null;
    } else {
      const rawObj = (label.raw || null) as
        | DpdEndpointAttempt
        | { attempt?: DpdEndpointAttempt; dpdError?: string | null }
        | null;
      lastAttempt = (rawObj && "attempt" in rawObj ? rawObj.attempt || null : (rawObj as DpdEndpointAttempt | null)) || null;
      const responseTextSafe = lastAttempt?.responseTextSafe || null;
      const dpdError =
        rawObj && typeof rawObj === "object" && "dpdError" in rawObj ? String(rawObj.dpdError || "") : "";
      const detailed = responseTextSafe || dpdError || label.reason;
      labelErrorMessage = detailed ? `DPD label API error: ${detailed}` : label.reason;
    }

    if (debug) {
      return Response.json(
        {
          ok: label.ok,
          debug: true,
          orderId,
          market,
          orderNumber: order.orderNumber,
          dpdShipmentId: shipmentId || null,
          trackingNumber: order.trackingNumber || null,
          dpdStatusInDb: order.dpdShipmentStatus || null,
          endpointAttemptResults: lastAttempt,
          errorMessage: label.ok ? null : labelErrorMessage,
        },
        { status: 200 }
      );
    }

    if (!label.ok) {
      return Response.json(
        {
          ok: false,
          step,
          reason: label.reason,
          orderId,
          market,
          dpdShipmentId: shipmentId,
          dpdStatusInDb: order.dpdShipmentStatus || null,
          endpointAttemptResults: lastAttempt,
          errorMessage: labelErrorMessage || label.reason,
        },
        { status: 502 }
      );
    }
    return new Response(new Uint8Array(label.data.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dpd-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        step,
        reason: "unexpected_error",
        orderId,
        market,
        endpointAttemptResults: lastAttempt,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
