import { autoCancelExpiredOrders, readStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { isHuAdminRequest } from "@/lib/admin-guard";
import { buildOrdersDocxBuffer } from "@/lib/admin-docx";

export async function POST(request: NextRequest) {
  if (!isHuAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  await autoCancelExpiredOrders();
  const store = await readStore("HU");
  const body = (await request.json().catch(() => ({}))) as { orderIds?: string[] };
  const orderIds = Array.isArray(body.orderIds)
    ? body.orderIds.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  if (orderIds.length === 0) {
    return NextResponse.json({ ok: false, message: "Nincs kivalasztott rendeles." }, { status: 400 });
  }
  const selected = store.orders.filter((o) => orderIds.includes(o.id));
  if (selected.length === 0) {
    return NextResponse.json({ ok: false, message: "A kivalasztott rendelesek nem talalhatok." }, { status: 404 });
  }
  const bytes = await buildOrdersDocxBuffer(selected, "HU", "HUF");
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="orders-hu-${Date.now()}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
