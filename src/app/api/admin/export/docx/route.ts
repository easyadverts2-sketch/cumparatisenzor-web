import { autoCancelExpiredOrders, readStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { buildOrdersDocxBuffer } from "@/lib/admin-docx";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  await autoCancelExpiredOrders();
  const store = await readStore();
  const body = (await request.json().catch(() => ({}))) as { orderIds?: string[] };
  const orderIds = Array.isArray(body.orderIds)
    ? body.orderIds.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  if (orderIds.length === 0) {
    return NextResponse.json({ ok: false, message: "Nebyla vybrana zadna objednavka." }, { status: 400 });
  }
  const selected = store.orders.filter((o) => orderIds.includes(o.id));
  if (selected.length === 0) {
    return NextResponse.json({ ok: false, message: "Vybrane objednavky nebyly nalezeny." }, { status: 404 });
  }
  const bytes = await buildOrdersDocxBuffer(selected, "RO", "RON");
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="orders-ro-${Date.now()}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
