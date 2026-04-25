import { isAdminRequest } from "@/lib/admin-guard";
import {
  buildPplBatchLabelFallbackUrl,
  fetchPplBatchLabelPdf,
  fetchPplBatchStatus,
  fetchPplLabelPdfFromUrl,
  resolvePplLabelEndpoint,
} from "@/lib/ppl";
import { getOrderById, syncPplBatch } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const market = "RO";
  let step = "auth";
  let labelUrlTried: string | null = null;
  let pplResponseStatus: number | null = null;
  let pplResponseContentType: string | null = null;
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
    step = "validate_input";
    const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim();
    const debug = String(request.nextUrl.searchParams.get("debug") || "").trim() === "1";
    if (!orderId) {
      return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
    }
    step = "load_order";
    let order = await getOrderById(orderId, market);
    if (!order) {
      return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
    }

    step = "sync_batch";
    await syncPplBatch(orderId, market, { skipLabelPersistence: true }).catch(() => undefined);
    order = (await getOrderById(orderId, market)) || order;

    const baseUrl = process.env.PPL_API_BASE_URL?.trim() || "";
    const batchId = String(order.pplBatchId || "").trim();
    const hasTrackingNumber = Boolean(String(order.trackingNumber || "").trim());

    let completeLabelUrl: string | null = null;
    let itemLabelUrl: string | null = null;
    let itemShipmentNumber: string | null = null;
    if (batchId) {
      step = "fetch_batch_status";
      const status = await fetchPplBatchStatus(batchId);
      if (status.ok) {
        const raw = status.data.raw && typeof status.data.raw === "object" ? (status.data.raw as Record<string, unknown>) : {};
        const items = Array.isArray(raw.items) ? raw.items : [];
        const ref = String(order.pplOrderReference || order.orderNumber);
        const item =
          items.find((it) => {
            const rec = it && typeof it === "object" ? (it as Record<string, unknown>) : {};
            const referenceId = String(rec.referenceId || "").trim();
            return referenceId === String(order.orderNumber) || referenceId === ref;
          }) || (items.length === 1 ? items[0] : null);
        const itemRec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        itemLabelUrl = String(itemRec.labelUrl || "").trim() || null;
        itemShipmentNumber = String(itemRec.shipmentNumber || "").trim() || null;
        const completeLabel = raw.completeLabel && typeof raw.completeLabel === "object" ? (raw.completeLabel as Record<string, unknown>) : {};
        const labelUrls = Array.isArray(completeLabel.labelUrls) ? completeLabel.labelUrls.map((x) => String(x || "").trim()).filter(Boolean) : [];
        completeLabelUrl = labelUrls[0] || null;
      }
    }
    const fallbackUrl = batchId && baseUrl ? buildPplBatchLabelFallbackUrl(baseUrl, batchId) : null;
    const itemLabelResolved = itemLabelUrl && baseUrl ? resolvePplLabelEndpoint(baseUrl, itemLabelUrl) : null;
    const endpoints = [
      { source: "completeLabel.labelUrls[0]", url: completeLabelUrl },
      { source: "batch_fallback_label", url: fallbackUrl },
      { source: "item.labelUrl", url: itemLabelResolved },
    ].filter((x) => Boolean(x.url));

    if (debug) {
      return NextResponse.json(
        {
          ok: true,
          debug: true,
          orderId,
          market,
          orderNumber: order.orderNumber,
          pplBatchId: batchId || null,
          trackingNumber: order.trackingNumber || itemShipmentNumber || null,
          pplImportState: order.pplImportState || null,
          hasCompleteLabelUrl: Boolean(completeLabelUrl),
          hasItemLabelUrl: Boolean(itemLabelUrl),
          labelEndpointsToTry: endpoints,
          lastPplResponseStatus: pplResponseStatus,
          lastPplResponseContentType: pplResponseContentType,
        },
        { status: 200 }
      );
    }

    for (const endpoint of endpoints) {
      labelUrlTried = String(endpoint.url || "");
      step = `download_label_${endpoint.source}`;
      const res =
        endpoint.source === "item.labelUrl"
          ? await fetchPplLabelPdfFromUrl(labelUrlTried)
          : await fetchPplBatchLabelPdf({ batchId, completeLabelUrl: labelUrlTried });
      if (!res.ok) {
        const match = /ppl_api_http_(\d+)/.exec(String(res.reason || ""));
        pplResponseStatus = match ? Number(match[1]) : pplResponseStatus;
        continue;
      }
      const contentType = String(res.data.contentType || "");
      const bytes = res.data.bytes;
      const isPdf = contentType.toLowerCase().includes("application/pdf") || (bytes.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF");
      pplResponseStatus = 200;
      pplResponseContentType = contentType;
      if (!isPdf) {
        continue;
      }
      return new NextResponse(new Uint8Array(bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="ppl-${order.orderNumber}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        step,
        reason: "ppl_label_download_failed",
        orderId,
        market,
        hasPplBatchId: Boolean(batchId),
        hasTrackingNumber,
        pplImportState: order.pplImportState || null,
        labelUrlTried,
        pplResponseStatus,
        pplResponseContentType,
        errorMessage: "Label endpoint did not return valid PDF.",
      },
      { status: 502 }
    );
  } catch (error) {
    const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim();
    const order = orderId ? await getOrderById(orderId, market).catch(() => null) : null;
    return NextResponse.json(
      {
        ok: false,
        step,
        reason: "unexpected_error",
        orderId: orderId || null,
        market,
        hasPplBatchId: Boolean(order?.pplBatchId),
        hasTrackingNumber: Boolean(order?.trackingNumber),
        pplImportState: order?.pplImportState || null,
        labelUrlTried,
        pplResponseStatus,
        pplResponseContentType,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
