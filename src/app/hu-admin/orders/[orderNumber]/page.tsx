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

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "ORDERED_NOT_PAID":
      return "Objednáno (převod)";
    case "ORDERED_PAID_NOT_SHIPPED":
      return "Zaplaceno převodem";
    case "WAITING_FOR_SHIPPING":
    case "ORDERED_PPLRDY":
      return "Čeká na odeslání";
    case "SHIPPED":
      return "Odesláno";
    case "CANCELLED_BY_US":
    case "CANCELLED_BY_CUSTOMER":
    case "CANCELLED_QUANTITY":
      return "Zamítnuto";
    default:
      return status;
  }
}

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

async function updateTracking(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const orderNo = String(formData.get("orderNumber") || "");
  const trackingNumber = String(formData.get("trackingNumber") || "");
  if (orderId && trackingNumber.trim()) {
    await updateOrderTrackingNumber(orderId, trackingNumber, "HU");
  }
  revalidatePath("/hu-admin");
  if (orderNo) revalidatePath(`/hu-admin/orders/${orderNo}`);
}

async function triggerShipment(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const orderNo = String(formData.get("orderNumber") || "");
  if (orderId) {
    await triggerShipmentCreation(orderId, "HU");
  }
  revalidatePath("/hu-admin");
  if (orderNo) revalidatePath(`/hu-admin/orders/${orderNo}`);
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
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Zákazník:</strong> {order.customerName}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Email:</strong> {order.email}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Telefon:</strong> {order.phone}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Platba:</strong> {formatPaymentMethodLabel(order.paymentMethod)}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Dopravce:</strong> {formatShippingLine(order)}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Celkem:</strong> {order.totalPrice} HUF</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Fakturační adresa:</strong> <span className="whitespace-pre-line">{order.billingAddress}</span></p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Doručovací adresa:</strong> <span className="whitespace-pre-line">{order.deliveryAddress}</span></p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Další poznámky:</strong> <span className="whitespace-pre-line">{order.additionalNotes || "-"}</span></p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">Tracking:</strong> {order.trackingNumber || "-"}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">PPL API stav:</strong> {order.pplShipmentStatus || "-"}</p>
        <p className="text-[#1a4d47]"><strong className="text-[#0a2624]">DPD API stav:</strong> {order.dpdShipmentStatus || "-"}</p>
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

        <form action={updateStatus} className="flex flex-wrap items-end gap-3 border-t border-[#0d4f4a]/10 pt-6">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="orderNumber" value={String(order.orderNumber)} />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#0f766e]">Stav</span>
            <select name="status" defaultValue={order.status} className="rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2">
              {ORDER_STATUSES.filter((status) => status !== "ORDERED_PPLRDY").map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[#0d9488] px-4 py-2 font-medium text-white">
            Uložit
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
