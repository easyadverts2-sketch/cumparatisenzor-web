import { autoCancelExpiredOrders, readStore } from "@/lib/store";

export async function GET() {
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
