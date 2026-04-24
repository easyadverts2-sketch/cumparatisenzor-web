import {
  autoCancelExpiredOrders,
  formatPaymentMethodLabel,
  formatShippingLine,
  getOrderByNumber,
  triggerShipmentCreation,
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

async function triggerShipment(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const orderNo = String(formData.get("orderNumber") || "");
  if (orderId) {
    await triggerShipmentCreation(orderId, "RO");
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
        ← Zpět na seznam objednávek
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0a2624]">
        Objednávka {formatOrderNumber(order.orderNumber)}
      </h1>
      <p className="mt-1 text-sm text-[#1a4d47]">
        {new Date(order.createdAt).toLocaleString("cs-CZ")} · Interní ID:{" "}
        <span className="font-mono text-xs">{order.id}</span>
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border-2 border-[#0d4f4a]/10 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-[#0f766e]">Zákazník</h2>
          <p className="text-[#0a2624]">{order.customerName}</p>
          <p className="text-[#1a4d47]">{order.email}</p>
          <p className="text-[#1a4d47]">{order.phone}</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#0f766e]">Adresy</h2>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Fakturační:</strong>{" "}
            <span className="whitespace-pre-line">{order.billingAddress}</span>
          </p>
          <p className="mt-2 text-[#1a4d47]">
            <strong className="text-[#0a2624]">Doručovací:</strong>{" "}
            <span className="whitespace-pre-line">{order.deliveryAddress}</span>
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Množství:</strong> {order.quantity}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Platba:</strong> {formatPaymentMethodLabel(order.paymentMethod)}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Dopravce:</strong> {formatShippingLine(order)}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Celkem:</strong> {order.totalPrice} RON
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Doprava:</strong> {order.shippingPrice} RON
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Tracking:</strong> {order.trackingNumber || "-"}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">PPL status API:</strong> {order.pplShipmentStatus || "-"}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">DPD status API:</strong> {order.dpdShipmentStatus || "-"}
          </p>
          <p className="text-[#1a4d47]">
            <strong className="text-[#0a2624]">Štítek PDF:</strong>{" "}
            {order.pplLabelPath || order.dpdLabelPath ? (
              <a
                href={order.pplLabelPath || order.dpdLabelPath || "#"}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#0f766e] hover:underline"
              >
                Otevřít štítek
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
            <span className="text-xs font-medium text-[#0f766e]">Stav</span>
            <select name="status" defaultValue={order.status} className="rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2">
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[#0d9488] px-4 py-2 font-medium text-white">
            Uložit stav
          </button>
        </form>

        <form action={updateTracking} className="flex flex-wrap items-end gap-3 border-t border-[#0d4f4a]/10 pt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={String(order.orderNumber)} />
          <label className="flex min-w-[260px] flex-col gap-1">
            <span className="text-xs font-medium text-[#0f766e]">Číslo zásilky / tracking</span>
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber || order.pplShipmentId || order.dpdShipmentId || ""}
              className="rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2"
              placeholder="Např. PPL123456789"
            />
          </label>
          <button type="submit" className="rounded-lg bg-[#6f2147] px-4 py-2 font-medium text-white">
            Uložit tracking + poslat e-mail
          </button>
        </form>
        <form action={triggerShipment} className="flex items-center gap-3 border-t border-[#0d4f4a]/10 pt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={String(order.orderNumber)} />
          <button type="submit" className="rounded-lg bg-[#0f766e] px-4 py-2 font-medium text-white">
            Test odeslání zásilky (PPL/DPD)
          </button>
          <span className="text-xs text-[#1a4d47]">Bez vytváření nové objednávky</span>
        </form>
      </div>
    </main>
  );
}
