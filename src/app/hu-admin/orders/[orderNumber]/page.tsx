import {
  autoCancelExpiredOrders,
  formatPaymentMethodLabel,
  formatShippingLine,
  getOrderByNumber,
  updateOrderStatus,
} from "@/lib/store";
import { ORDER_STATUSES, OrderStatus } from "@/lib/types";
import { formatOrderNumber } from "@/lib/order-format";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function updateStatus(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const orderNo = String(formData.get("orderNumber") || "");
  const status = String(formData.get("status") || "") as OrderStatus;
  if (ORDER_STATUSES.includes(status)) {
    await updateOrderStatus(orderId, status, "HU");
  }
  revalidatePath("/hu-admin");
  if (orderNo) {
    revalidatePath(`/hu-admin/orders/${orderNo}`);
  }
}

export default async function HuAdminOrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  await autoCancelExpiredOrders();
  const num = parseInt(params.orderNumber, 10);
  if (!Number.isFinite(num)) notFound();
  const order = await getOrderByNumber(num, "HU");
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/hu-admin" className="text-sm font-medium text-[#0f766e] hover:underline">
        ← Vissza a rendelesekhez
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0a2624]">
        Rendeles {formatOrderNumber(order.orderNumber)}
      </h1>
      <p className="mt-1 text-sm text-[#1a4d47]">
        {new Date(order.createdAt).toLocaleString("hu-HU")} · Belső ID:{" "}
        <span className="font-mono text-xs">{order.id}</span>
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border-2 border-[#0d4f4a]/10 bg-white p-6 shadow-sm">
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Ugyfel:</strong> {order.customerName}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Email:</strong> {order.email}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Telefon:</strong> {order.phone}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Fizetes:</strong> {formatPaymentMethodLabel(order.paymentMethod)}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Futar:</strong> {formatShippingLine(order)}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Vegosszeg:</strong> {order.totalPrice} HUF</p>

        <form action={updateStatus} className="flex flex-wrap items-end gap-3 border-t border-[#0d4f4a]/10 pt-6">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={String(order.orderNumber)} />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#0f766e]">Statusz</span>
            <select name="status" defaultValue={order.status} className="rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2">
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[#0d9488] px-4 py-2 font-medium text-white">
            Mentes
          </button>
        </form>
      </div>
    </main>
  );
}
