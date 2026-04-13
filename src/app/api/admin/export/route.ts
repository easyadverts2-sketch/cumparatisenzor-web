import { autoCancelExpiredOrders, readStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  await autoCancelExpiredOrders();
  const store = await readStore();

  const header = [
    "order_id",
    "created_at",
    "name",
    "email",
    "phone",
    "quantity",
    "payment",
    "status",
    "total_ron",
    "delivery_address",
  ];
  const rows = store.orders.map((o) => [
    o.id,
    o.createdAt,
    o.customerName,
    o.email,
    o.phone,
    String(o.quantity),
    o.paymentMethod,
    o.status,
    String(o.totalPrice),
    o.deliveryAddress.replaceAll("\n", " "),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=orders.csv",
    },
  });
}
