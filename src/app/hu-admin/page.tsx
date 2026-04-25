import { AdminOrdersList } from "@/components/admin-orders-list";
import {
  autoCancelExpiredOrders,
  cancelDpdShipmentForOrder,
  cancelPplShipmentForOrder,
  deleteDpdShipmentForOrder,
  deletePplShipmentForOrder,
  getDpdBulkLabelForOrders,
  getDpdPickups,
  getDpdShipmentsAdmin,
  getPplPickups,
  getPplShipmentsAdmin,
  orderDpdPickup,
  orderPplPickup,
  regenerateDpdLabelForOrder,
  readStore,
  refreshDpdShipment,
  refreshPplShipment,
  triggerShipmentCreation,
  writeStore,
} from "@/lib/store";
import { revalidatePath } from "next/cache";
import { clearHuAdminSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function updateInventory(formData: FormData) {
  "use server";
  const inventory = Number(formData.get("inventory") || 0);
  if (inventory >= 0) {
    const store = await readStore("HU");
    store.inventory = inventory;
    await writeStore(store, "HU");
  }
  revalidatePath("/hu-admin");
}

async function logoutAction() {
  "use server";
  clearHuAdminSessionCookie();
  redirect("/hu-admin/login");
}

async function createShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await triggerShipmentCreation(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function refreshShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await refreshPplShipment(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function cancelShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await cancelPplShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function deleteShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await deletePplShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function orderPickupAction(formData: FormData) {
  "use server";
  const note = String(formData.get("note") || "");
  await orderPplPickup("HU", note);
  revalidatePath("/hu-admin");
}

async function refreshDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await refreshDpdShipment(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function cancelDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await cancelDpdShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function deleteDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await deleteDpdShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function regenerateDpdLabelAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (orderId) await regenerateDpdLabelForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
}

async function orderDpdPickupAction(formData: FormData) {
  "use server";
  const note = String(formData.get("note") || "");
  await orderDpdPickup("HU", note);
  revalidatePath("/hu-admin");
}

async function bulkDpdLabelsAction(formData: FormData) {
  "use server";
  const orderIds = formData
    .getAll("orderIds")
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const path = await getDpdBulkLabelForOrders(orderIds, "HU");
  revalidatePath("/hu-admin");
  if (path) {
    revalidatePath(path);
  }
}

export default async function HuAdminPage() {
  await autoCancelExpiredOrders();
  const [store, pplShipments, pickups, dpdShipments, dpdPickups] = await Promise.all([
    readStore("HU"),
    getPplShipmentsAdmin("HU", 100),
    getPplPickups("HU", 20),
    getDpdShipmentsAdmin("HU", 100),
    getDpdPickups("HU", 20),
  ]);
  const waitingPayment = store.orders.filter((o) => o.status === "ORDERED_NOT_PAID").length;
  const readyToShip = store.orders.filter((o) => o.status === "ORDERED_PAID_NOT_SHIPPED").length;
  const inDelivery = store.orders.filter((o) => o.status === "WAITING_FOR_SHIPPING").length;
  const shipped = store.orders.filter((o) => o.status === "SHIPPED").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-[#0a2624]">Administrace objednávek (HU)</h1>
      <p className="mt-1 text-[#1a4d47]">Oddělené objednávky z domény szenzorvasarlas.hu.</p>
      <form action={logoutAction} className="mt-3">
        <button className="rounded-lg border-2 border-[#0d4f4a]/20 bg-white px-3 py-1.5 text-sm text-[#0a2624]">
          Odhlásit
        </button>
      </form>
      <p className="mt-4 font-medium text-[#0a2624]">Aktuální sklad: {store.inventory} ks</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Nezaplacené</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{waitingPayment}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Zaplacené / Příprava</p>
          <p className="mt-1 text-2xl font-bold text-indigo-900">{readyToShip}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Ve zpracování</p>
          <p className="mt-1 text-2xl font-bold text-sky-900">{inDelivery}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Odeslané</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{shipped}</p>
        </div>
      </div>

      <form action={updateInventory} className="mt-4 flex max-w-sm flex-wrap gap-2">
        <input
          type="number"
          name="inventory"
          defaultValue={store.inventory}
          className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2 text-[#0a2624] sm:w-40"
        />
        <button type="submit" className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">
          Uložit sklad
        </button>
      </form>

      <a href="/api/hu-admin/export" className="mt-4 inline-block text-sm font-medium text-[#0f766e] hover:underline">
        Export CSV
      </a>

      <div className="mt-10">
        <AdminOrdersList orders={store.orders} locale="hu-HU" currency="HUF" detailsBasePath="/hu-admin/orders" />
      </div>

      <h2 className="mt-12 text-2xl font-semibold">PPL zásilky a svozy</h2>
      <form action={orderPickupAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="min-w-[260px] flex-1 text-sm">
          <span className="mb-1 block text-[#1a4d47]">Poznámka pro svoz (volitelné)</span>
          <input name="note" className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Např. svoz mezi 9:00-12:00" />
        </label>
        <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Objednat svoz</button>
      </form>
      <div className="mt-3 space-y-1 text-sm text-[#1a4d47]">
        {pickups.slice(0, 5).map((p) => (
          <p key={p.id}>
            {new Date(p.createdAt).toLocaleString("cs-CZ")} · {p.pickupId} · {p.status}
            {p.note ? ` · ${p.note}` : ""}
          </p>
        ))}
      </div>
      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Objednávka</th>
              <th className="px-3 py-2">Zákazník</th>
              <th className="px-3 py-2">Shipment ID</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Stav PPL</th>
              <th className="px-3 py-2">Štítek</th>
              <th className="px-3 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {pplShipments.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{o.customerName}</td>
                <td className="px-3 py-2">{o.pplShipmentId || "-"}</td>
                <td className="px-3 py-2">{o.trackingNumber || "-"}</td>
                <td className="px-3 py-2">{o.pplShipmentStatus || "-"}</td>
                <td className="px-3 py-2">
                  {o.pplLabelPath ? (
                    <a href={o.pplLabelPath} target="_blank" rel="noreferrer" className="text-[#0f766e] hover:underline">
                      Tisk stitku
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <form action={createShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Vytvořit</button></form>
                    <form action={refreshShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Refresh</button></form>
                    <form action={cancelShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Storno</button></form>
                    <form action={deleteShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Smazat zasilku</button></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl font-semibold">DPD zásilky a svozy</h2>
      <form action={orderDpdPickupAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="min-w-[260px] flex-1 text-sm">
          <span className="mb-1 block text-[#1a4d47]">Poznámka pro DPD svoz (volitelné)</span>
          <input name="note" className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Např. svoz zítra 10:00-14:00" />
        </label>
        <button className="rounded-lg bg-[#6f2147] px-4 py-2 text-white">Objednat DPD svoz</button>
      </form>
      <div className="mt-3 space-y-1 text-sm text-[#1a4d47]">
        {dpdPickups.slice(0, 5).map((p) => (
          <p key={p.id}>
            {new Date(p.createdAt).toLocaleString("cs-CZ")} · {p.pickupId}
            {p.pickupDate ? ` · ${p.pickupDate}` : ""} · {p.status}
            {p.note ? ` · ${p.note}` : ""}
          </p>
        ))}
      </div>
      <form
        id="dpd-bulk-form-hu"
        action={bulkDpdLabelsAction}
        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3"
      >
        <p className="min-w-[320px] flex-1 text-sm text-[#1a4d47]">
          Vyber objednavky pres checkbox ve sloupci &quot;Vybrat&quot; a klikni na bulk tisk.
        </p>
        <button className="rounded-lg bg-[#6f2147] px-4 py-2 text-white">Vygenerovat bulk DPD štítky</button>
      </form>
      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Vybrat</th>
              <th className="px-3 py-2">Objednávka</th>
              <th className="px-3 py-2">Zákazník</th>
              <th className="px-3 py-2">Shipment ID</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Stav DPD</th>
              <th className="px-3 py-2">Štítek</th>
              <th className="px-3 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {dpdShipments.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    name="orderIds"
                    value={o.id}
                    form="dpd-bulk-form-hu"
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{o.customerName}</td>
                <td className="px-3 py-2">{o.dpdShipmentId || "-"}</td>
                <td className="px-3 py-2">{o.trackingNumber || "-"}</td>
                <td className="px-3 py-2">{o.dpdShipmentStatus || "-"}</td>
                <td className="px-3 py-2">
                  {o.dpdLabelPath ? (
                    <a href={o.dpdLabelPath} target="_blank" rel="noreferrer" className="text-[#6f2147] hover:underline">
                      Tisk stitku
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <form action={createShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Vytvořit</button></form>
                    <form action={regenerateDpdLabelAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Generovat stitek</button></form>
                    <form action={refreshDpdShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Refresh</button></form>
                    <form action={cancelDpdShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Storno</button></form>
                    <form action={deleteDpdShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Smazat zasilku</button></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
