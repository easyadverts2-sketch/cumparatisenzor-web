import { fetchDpdLabelPdfForShipments, type DpdEndpointAttempt } from "./dpd";
import { getOrderById, refreshDpdShipment } from "./store";
import type { Market } from "./types";

export async function resolveDpdLabelDownload(
  orderId: string,
  market: Market,
  debug = false
): Promise<Response> {
  let step = "load_order";
  let lastAttempt: DpdEndpointAttempt | null = null;
  try {
    let order = await getOrderById(orderId, market);
    if (!order) return Response.json({ ok: false, step, reason: "order_not_found", orderId, market }, { status: 404 });

    step = "sync_shipment";
    await refreshDpdShipment(orderId, market).catch(() => undefined);
    order = (await getOrderById(orderId, market)) || order;
    const shipmentId = String(order.dpdShipmentId || "").trim();
    if (!shipmentId) {
      return Response.json(
        {
          ok: false,
          step,
          reason: "missing_dpd_shipment_id",
          orderId,
          market,
          hasTrackingNumber: Boolean(order.trackingNumber),
          dpdStatusInDb: order.dpdShipmentStatus || null,
        },
        { status: 409 }
      );
    }

    step = "download_label";
    const label = await fetchDpdLabelPdfForShipments([shipmentId]);
    lastAttempt = (label.ok ? label.data.attempt : (label.raw as DpdEndpointAttempt)) || null;

    if (debug) {
      return Response.json(
        {
          ok: label.ok,
          debug: true,
          orderId,
          market,
          orderNumber: order.orderNumber,
          dpdShipmentId: shipmentId,
          trackingNumber: order.trackingNumber || null,
          dpdStatusInDb: order.dpdShipmentStatus || null,
          endpointAttemptResults: lastAttempt,
          errorMessage: label.ok ? null : label.reason,
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
          errorMessage: "DPD label endpoint did not return valid PDF.",
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
