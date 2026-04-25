import { AdminOrdersList } from "@/components/admin-orders-list";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  autoCancelExpiredOrders,
  cancelDpdShipmentForOrder,
  cancelPplShipmentForOrder,
  deleteDpdShipmentForOrder,
  debugFindPplTrackingNumber,
  getDpdBulkLabelForOrders,
  getDpdPickups,
  getDpdShipmentsAdmin,
  getPplPickups,
  getPplBulkLabelForOrders,
  getPplShipmentsAdmin,
  orderDpdPickup,
  orderPplPickup,
  regenerateDpdLabelForOrder,
  refreshDpdShipment,
  refreshPplShipment,
  resetPplShipmentForOrder,
  readStore,
  updateOrderStatus,
  writeStore,
} from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { clearAdminSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function validTracking(value: string | null | undefined) {
  const raw = String(value || "").trim();
  return /^\d{8,20}$/.test(raw) ? raw : "-";
}

async function updateStatus(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const orderNumber = String(formData.get("orderNumber") || "");
  const status = String(formData.get("status") || "") as (typeof ORDER_STATUSES)[number];
  if (ORDER_STATUSES.includes(status)) {
    await updateOrderStatus(orderId, status);
  }
  revalidatePath("/admin");
  if (orderNumber) {
    revalidatePath(`/admin/orders/${orderNumber}`);
  }
}

async function updateInventory(formData: FormData) {
  "use server";
  const inventory = Number(formData.get("inventory") || 0);
  if (inventory >= 0) {
    const store = await readStore();
    store.inventory = inventory;
    await writeStore(store);
  }
  revalidatePath("/admin");
}

async function logoutAction() {
  "use server";
  clearAdminSessionCookie();
  redirect("/admin/login");
}

async function refreshShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await refreshPplShipment(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+stav+obnoven" : "PPL+refresh+selhal"}`);
}

async function cancelShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelPplShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+zasilka+stornovana" : "PPL+storno+selhalo"}`);
}

async function deleteShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await resetPplShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+udaje+lokalne+vycisteny" : "Lokalni+reset+PPL+selhal"}`);
}

async function debugFindTrackingAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const result = await debugFindPplTrackingNumber(orderId, "21491971453", "RO");
  revalidatePath("/admin");
  redirect(
    `/admin?ok=${result.found ? "1" : "0"}&msg=${encodeURIComponent(
      result.found
        ? `Tracking nalezen (${result.matches[0]?.path || "?"})`
        : `Tracking nenalezen, kandidatu: ${result.trackingNumberCandidates.length}`
    )}`
  );
}

async function orderPickupAction(formData: FormData) {
  "use server";
  const note = String(formData.get("note") || "");
  const result = await orderPplPickup("RO", note);
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function refreshDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await refreshDpdShipment(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+stav+obnoven" : "DPD+refresh+selhal"}`);
}

async function cancelDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelDpdShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+zasilka+stornovana" : "DPD+storno+selhalo"}`);
}

async function deleteDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await deleteDpdShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+zasilka+smazana" : "Smazani+DPD+zasilky+selhalo"}`);
}

async function regenerateDpdLabelAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const path = await regenerateDpdLabelForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${path ? "1" : "0"}&msg=${path ? "DPD+stitek+vygenerovan" : "DPD+stitek+nelze+vygenerovat"}`);
}

async function orderDpdPickupAction(formData: FormData) {
  "use server";
  const note = String(formData.get("note") || "");
  const result = await orderDpdPickup("RO", note);
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function bulkDpdLabelsAction(formData: FormData) {
  "use server";
  const orderIds = formData
    .getAll("orderIds")
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const path = await getDpdBulkLabelForOrders(orderIds, "RO");
  revalidatePath("/admin");
  if (path) revalidatePath(path);
  redirect(`/admin?ok=${path ? "1" : "0"}&msg=${path ? "DPD+bulk+stitky+vygenerovany" : "DPD+bulk+stitky+selhaly"}`);
}

async function bulkPplLabelsAction(formData: FormData) {
  "use server";
  const orderIds = formData
    .getAll("orderIds")
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const path = await getPplBulkLabelForOrders(orderIds, "RO");
  revalidatePath("/admin");
  if (path) revalidatePath(path);
  redirect(`/admin?ok=${path ? "1" : "0"}&msg=${path ? "PPL+bulk+stitky+vygenerovany" : "PPL+bulk+stitky+selhaly"}`);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { ok?: string; msg?: string };
}) {
  await autoCancelExpiredOrders();
  const [store, pplShipments, pickups, dpdShipments, dpdPickups] = await Promise.all([
    readStore(),
    getPplShipmentsAdmin("RO", 100),
    getPplPickups("RO", 20),
    getDpdShipmentsAdmin("RO", 100),
    getDpdPickups("RO", 20),
  ]);
  const waitingPayment = store.orders.filter((o) => o.status === "ORDERED_NOT_PAID").length;
  const readyToShip = store.orders.filter((o) => o.status === "ORDERED_PAID_NOT_SHIPPED").length;
  const inDelivery = store.orders.filter((o) => o.status === "WAITING_FOR_SHIPPING").length;
  const shipped = store.orders.filter((o) => o.status === "SHIPPED").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-[#0a2624]">Administrace objednávek (RO)</h1>
      <p className="mt-1 text-[#1a4d47]">Seznam objednávek, filtry a detail objednávky.</p>
      <form action={logoutAction} className="mt-3">
        <button className="rounded-lg border-2 border-[#0d4f4a]/20 bg-white px-3 py-1.5 text-sm text-[#0a2624]">
          Odhlásit
        </button>
      </form>
      {searchParams?.msg ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            searchParams.ok === "1"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {decodeURIComponent(searchParams.msg)}
        </p>
      ) : null}
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

      <a
        href="/api/admin/export"
        className="mt-4 inline-block text-sm font-medium text-[#0f766e] hover:underline"
      >
        Export CSV (Excel / Sheets)
      </a>

      <div className="mt-10">
        <AdminOrdersList orders={store.orders} />
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
      <form id="ppl-bulk-form-ro" action={bulkPplLabelsAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <p className="min-w-[320px] flex-1 text-sm text-[#1a4d47]">
          Vyber objednavky PPL pres checkbox a klikni na bulk tisk stitku.
        </p>
        <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Vygenerovat bulk PPL stitky</button>
      </form>
      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Vybrat</th>
              <th className="px-3 py-2">Objednávka</th>
              <th className="px-3 py-2">Datum zásilky</th>
              <th className="px-3 py-2">Služba</th>
              <th className="px-3 py-2">Adresa</th>
              <th className="px-3 py-2">Číslo zásilky</th>
              <th className="px-3 py-2">Batch / Import</th>
              <th className="px-3 py-2">Stav PPL</th>
              <th className="px-3 py-2">Štítek</th>
              <th className="px-3 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {pplShipments.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input type="checkbox" name="orderIds" value={o.id} form="ppl-bulk-form-ro" className="h-4 w-4" />
                </td>
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString("cs-CZ")}</td>
                <td className="px-3 py-2">PPL</td>
                <td className="px-3 py-2 max-w-[220px] truncate">{o.deliveryAddress.replaceAll("\n", ", ")}</td>
                <td className="px-3 py-2">{validTracking(o.trackingNumber || o.pplShipmentId)}</td>
                <td className="px-3 py-2 text-xs">
                  <div>{o.pplBatchId || "-"}</div>
                  <div>{o.pplImportState || "-"}</div>
                  <div>HTTP {o.pplLastHttpStatus || "-"}</div>
                </td>
                <td className="px-3 py-2">{o.pplShipmentStatus || "-"}</td>
                <td className="px-3 py-2">
                  <a
                    href={`/api/admin/ppl-label?orderId=${encodeURIComponent(o.id)}`}
                    className="text-[#0f766e] hover:underline"
                  >
                    Stahnout stitek
                  </a>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <form action={refreshShipmentAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Refresh</button></form>
                    <form action={cancelShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-2 py-1"
                        label="Stornovat v PPL"
                        confirmMessage="Tato akce se pokusi stornovat zasilku primo v PPL. Pokud PPL storno potvrdi, lokalni PPL data objednavky se vycisti. Pokud PPL vrati chybu, lokalni data zustanou zachovana. Pokracovat?"
                      />
                    </form>
                    <form action={deleteShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-2 py-1"
                        label="Lokalni reset PPL"
                        confirmMessage="Tato akce pouze vycisti PPL data v e-shopu. Nestornuje zasilku v PPL. Pouzijte jen pokud opravdu chcete odpojit objednavku lokalne. Pokracovat?"
                      />
                    </form>
                    <form action={debugFindTrackingAction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded border px-2 py-1">Debug najit tracking cislo</button></form>
                    <a
                      href={`/api/admin/ppl-diagnostic?orderId=${encodeURIComponent(o.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border px-2 py-1"
                    >
                      Diagnostika JSON
                    </a>
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
        id="dpd-bulk-form-ro"
        action={bulkDpdLabelsAction}
        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3"
      >
        <p className="min-w-[320px] flex-1 text-sm text-[#1a4d47]">
          Vyber objednavky pres checkbox ve sloupci &quot;Vybrat&quot; a klikni na bulk tisk.
        </p>
        <button className="rounded-lg bg-[#6f2147] px-4 py-2 text-white">
          Vygenerovat bulk DPD štítky
        </button>
      </form>
      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Vybrat</th>
              <th className="px-3 py-2">Objednávka</th>
              <th className="px-3 py-2">Datum zásilky</th>
              <th className="px-3 py-2">Služba</th>
              <th className="px-3 py-2">Adresa</th>
              <th className="px-3 py-2">Číslo zásilky</th>
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
                    form="dpd-bulk-form-ro"
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString("cs-CZ")}</td>
                <td className="px-3 py-2">DPD</td>
                <td className="px-3 py-2 max-w-[220px] truncate">{o.deliveryAddress.replaceAll("\n", ", ")}</td>
                <td className="px-3 py-2">{validTracking(o.trackingNumber || o.dpdShipmentId)}</td>
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
