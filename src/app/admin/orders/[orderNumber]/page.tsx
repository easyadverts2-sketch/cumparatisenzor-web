import {
  autoCancelExpiredOrders,
  formatPaymentMethodLabel,
  formatShippingLine,
  getOrderByNumber,
  updateOrderTrackingNumber,
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
    await updateOrderStatus(orderId, status);
  }
  revalidatePath("/admin");
  if (orderNo) {
    revalidatePath(`/admin/orders/${orderNo}`);
  }
}

async function updateTracking(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const orderNo = String(formData.get("orderNumber") || "");
  const trackingNumber = String(formData.get("trackingNumber") || "");
  if (orderId && trackingNumber.trim()) {
    await updateOrderTrackingNumber(orderId, trackingNumber);
  }
  revalidatePath("/admin");
  if (orderNo) revalidatePath(`/admin/orders/${orderNo}`);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  await autoCancelExpiredOrders();
  const num = parseInt(params.orderNumber, 10);
  if (!Number.isFinite(num)) notFound();
  const order = await getOrderByNumber(num);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-[#0f766e] hover:underline">
        ← Inapoi la lista comenzi
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0a2624]">
        Comanda {formatOrderNumber(order.orderNumber)}
      </h1>
      <p className="mt-1 text-sm text-[#1a4d47]">
        {new Date(order.createdAt).toLocaleString("ro-RO")} · ID intern:{" "}
        <span className="font-mono text-xs">{order.id}</span>
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border-2 border-[#0d4f4a]/10 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-[#0f766e]">Client</h2>
          <p className="text-[#0a2624]">{order.customerName}</p>
          <p className="text-[#1a4d47]">{order.email}</p>
          <p className="text-[#1a4d47]">{order.phone}</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#0f766e]">Adrese</h2>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Facturare:</strong> {order.billingAddress}
          </p>
          <p className="mt-2 text-[#1a4d47]">
            <strong className="text-[#0a2624]">Livrare:</strong> {order.deliveryAddress}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Cantitate:</strong> {order.quantity}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Plata:</strong> {formatPaymentMethodLabel(order.paymentMethod)}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Curier:</strong> {formatShippingLine(order)}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Total:</strong> {order.totalPrice} RON
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Livrare (linie):</strong> {order.shippingPrice} RON
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Tracking:</strong> {order.trackingNumber || "-"}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Eticheta PDF:</strong>{" "}
            {order.pplLabelPath ? (
              <a href={order.pplLabelPath} target="_blank" rel="noreferrer" className="font-medium text-[#0f766e] hover:underline">
                Deschide eticheta
              </a>
            ) : (
              "-"
            )}
          </p>
        </div>

        <form action={updateStatus} className="flex flex-wrap items-end gap-3 border-t border-[#0d4f4a]/10 pt-6">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={String(order.orderNumber)} />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#0f766e]">Status</span>
            <select name="status" defaultValue={order.status} className="rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2">
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[#0d9488] px-4 py-2 font-medium text-white">
            Salveaza status
          </button>
        </form>

        <form action={updateTracking} className="flex flex-wrap items-end gap-3 border-t border-[#0d4f4a]/10 pt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={String(order.orderNumber)} />
          <label className="flex min-w-[260px] flex-col gap-1">
            <span className="text-xs font-medium text-[#0f766e]">Numar colet / tracking</span>
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber || order.pplShipmentId || ""}
              className="rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2"
              placeholder="Ex: PPL123456789"
            />
          </label>
          <button type="submit" className="rounded-lg bg-[#6f2147] px-4 py-2 font-medium text-white">
            Salveaza tracking + trimite email
          </button>
        </form>
      </div>
    </main>
  );
}
