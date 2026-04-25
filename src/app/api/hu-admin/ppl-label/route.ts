import { isHuAdminRequest } from "@/lib/admin-guard";
import { ensurePplLabelForOrder, getOrderById, syncPplBatch } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";

export async function GET(request: NextRequest) {
  if (!isHuAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  }
  let order = await getOrderById(orderId, "HU");
  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  }
  const sync = await syncPplBatch(orderId, "HU");
  const labelPath = order.pplLabelPath || (await ensurePplLabelForOrder(order.id, "HU"));
  if (!labelPath) {
    order = (await getOrderById(orderId, "HU")) || order;
    return NextResponse.json(
      {
        ok: false,
        processing: Boolean(sync.processing),
        message:
          sync.message ||
          `PPL zasilku stale zpracovava (batchId=${order.pplBatchId || "-"}, importState=${order.pplImportState || "-"})`,
        batchId: order.pplBatchId || null,
        importState: order.pplImportState || null,
        httpStatus: order.pplLastHttpStatus || null,
        pplError: order.pplLastError || null,
      },
      { status: sync.processing ? 202 : 409 }
    );
  }
  if (/^https?:\/\//i.test(labelPath)) {
    return NextResponse.redirect(labelPath);
  }
  if (!labelPath.startsWith("/")) {
    return NextResponse.json({ ok: false, message: "Neplatna cesta stitku." }, { status: 500 });
  }
  const absPath = path.resolve(process.cwd(), `.${labelPath}`);
  const bytes = await readFile(absPath).catch(() => null);
  if (!bytes) {
    return NextResponse.json({ ok: false, message: "Soubor stitku nenalezen." }, { status: 404 });
  }
  order = (await getOrderById(orderId, "HU")) || order;
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ppl-${order.orderNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
