import { isAdminRequest } from "@/lib/admin-guard";
import { ensurePplLabelForOrder, getOrderById } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Missing orderId" }, { status: 400 });
  }
  let order = await getOrderById(orderId, "RO");
  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  }
  const labelPath = order.pplLabelPath || (await ensurePplLabelForOrder(order.id, "RO"));
  if (!labelPath) {
    return NextResponse.json({ ok: false, message: "Stitek zatim neni pripraven." }, { status: 409 });
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
  order = (await getOrderById(orderId, "RO")) || order;
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ppl-${order.orderNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
