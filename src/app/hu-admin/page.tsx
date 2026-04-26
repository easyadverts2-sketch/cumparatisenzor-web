import { AdminOrdersList } from "@/components/admin-orders-list";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  autoCancelExpiredOrders,
  cancelDpdPickupOrder,
  cancelDpdShipmentForOrder,
  cancelPplShipmentForOrder,
  cancelPplPickupOrder,
  getDpdPickups,
  getDpdShipmentsAdmin,
  getPplPickups,
  getPplBulkLabelForOrders,
  getPplShipmentsAdmin,
  orderDpdPickup,
  orderPplPickup,
  readStore,
  resetDpdShipmentForOrder,
  resetPplShipmentForOrder,
  writeStore,
} from "@/lib/store";
import { revalidatePath } from "next/cache";
import { clearHuAdminSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function validTracking(value: string | null | undefined) {
  const raw = String(value || "").trim();
  return /^\d{8,20}$/.test(raw) ? raw : "-";
}

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

async function deleteShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/hu-admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await resetPplShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+udaje+lokalne+vycisteny" : "Lokalni+reset+PPL+selhal"}`);
}

async function cancelShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/hu-admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelPplShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+zasilka+zrusena" : "PPL+zruseni+zasilky+selhalo"}`);
}

async function orderPickupAction(formData: FormData) {
  "use server";
  const result = await orderPplPickup("HU", {
    pickupDate: String(formData.get("pickupDate") || "").trim(),
    fromTime: String(formData.get("fromTime") || "").trim(),
    toTime: String(formData.get("toTime") || "").trim(),
    contactName: String(formData.get("contactName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    shipmentCount: Number(formData.get("shipmentCount") || 1),
    note: String(formData.get("note") || "").trim(),
  });
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function cancelPickupAction(formData: FormData) {
  "use server";
  const pickupId = String(formData.get("pickupId") || "").trim();
  const result = await cancelPplPickupOrder(pickupId, "HU");
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function cancelDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/hu-admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelDpdShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+zasilka+stornovana" : "DPD+storno+selhalo"}`);
}

async function deleteDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/hu-admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await resetDpdShipmentForOrder(orderId, "HU");
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+udaje+lokalne+vycisteny" : "Lokalni+reset+DPD+selhal"}`);
}

async function orderDpdPickupAction(formData: FormData) {
  "use server";
  const result = await orderDpdPickup("HU", {
    pickupDate: String(formData.get("pickupDate") || "").trim(),
    fromTime: String(formData.get("fromTime") || "").trim(),
    toTime: String(formData.get("toTime") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    contactName: String(formData.get("contactName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    parcelCount: Number(formData.get("parcelCount") || 1),
    totalWeight: Number(formData.get("totalWeight") || 1),
  });
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function cancelDpdPickupAction(formData: FormData) {
  "use server";
  const pickupId = String(formData.get("pickupId") || "").trim();
  const result = await cancelDpdPickupOrder(pickupId, "HU");
  revalidatePath("/hu-admin");
  redirect(`/hu-admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function bulkPplLabelsAction(formData: FormData) {
  "use server";
  const orderIds = formData
    .getAll("orderIds")
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const path = await getPplBulkLabelForOrders(orderIds, "HU");
  revalidatePath("/hu-admin");
  if (path) revalidatePath(path);
  redirect(`/hu-admin?ok=${path ? "1" : "0"}&msg=${path ? "PPL+bulk+stitky+vygenerovany" : "PPL+bulk+stitky+selhaly"}`);
}

export default async function HuAdminPage({
  searchParams,
}: {
  searchParams?: { ok?: string; msg?: string };
}) {
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

      <a href="/api/hu-admin/export" className="mt-4 inline-block text-sm font-medium text-[#0f766e] hover:underline">
        Export CSV
      </a>

      <div className="mt-10">
        <AdminOrdersList
          orders={store.orders}
          locale="hu-HU"
          currency="HUF"
          detailsBasePath="/hu-admin/orders"
          deleteApiPath="/api/hu-admin/order-hard-delete"
        />
      </div>

      <h2 className="mt-12 text-2xl font-semibold">PPL zásilky a svozy</h2>
      <form action={orderPickupAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="min-w-[150px] text-sm"><span className="mb-1 block text-[#1a4d47]">Datum svozu</span><input name="pickupDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[120px] text-sm"><span className="mb-1 block text-[#1a4d47]">Čas od</span><input name="fromTime" type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[120px] text-sm"><span className="mb-1 block text-[#1a4d47]">Čas do</span><input name="toTime" type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[180px] text-sm"><span className="mb-1 block text-[#1a4d47]">Kontakt</span><input name="contactName" className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[160px] text-sm"><span className="mb-1 block text-[#1a4d47]">Telefon</span><input name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[200px] text-sm"><span className="mb-1 block text-[#1a4d47]">E-mail</span><input name="email" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[120px] text-sm"><span className="mb-1 block text-[#1a4d47]">Počet balíků</span><input name="shipmentCount" type="number" min={1} defaultValue={1} className="w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>
        <label className="min-w-[260px] flex-1 text-sm"><span className="mb-1 block text-[#1a4d47]">Poznámka</span><input name="note" className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Volitelně" /></label>
        <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Objednat svoz</button>
      </form>
      <div className="mt-3 space-y-1 text-sm text-[#1a4d47]">
        {pickups.slice(0, 5).map((p) => (
          <form key={p.id} action={cancelPickupAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="pickupId" value={p.pickupId} />
            {new Date(p.createdAt).toLocaleString("cs-CZ")} · {p.pickupId} · {p.status}
            {p.note ? ` · ${p.note}` : ""}
            <ConfirmSubmitButton className="rounded border px-2 py-1" label="Zrusit svoz" confirmMessage="Tato akce se pokusi zrusit svoz v PPL." />
          </form>
        ))}
      </div>
      <form id="ppl-bulk-form-hu" action={bulkPplLabelsAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
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
              <th className="px-3 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {pplShipments.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input type="checkbox" name="orderIds" value={o.id} form="ppl-bulk-form-hu" className="h-4 w-4" />
                </td>
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString("cs-CZ")}</td>
                <td className="px-3 py-2">PPL</td>
                <td className="px-3 py-2 max-w-[420px] whitespace-normal break-words">{o.deliveryAddress.replaceAll("\n", ", ")}</td>
                <td className="px-3 py-2">{validTracking(o.trackingNumber || o.pplShipmentId)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <a href={`/api/hu-admin/ppl-label?orderId=${encodeURIComponent(o.id)}`} className="rounded border px-2 py-1">Tisk štítku</a>
                    <form action={cancelShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-2 py-1"
                        label="Zrušit PPL zásilku"
                        confirmMessage="Tímto rušíš pouze zásilku u dopravce. Objednávka v e-shopu zůstane."
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl font-semibold">DPD zásilky a svozy</h2>
      <form action={orderDpdPickupAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="min-w-[150px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Datum svozu</span>
          <input name="pickupDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[120px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Čas od</span>
          <input name="fromTime" type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[120px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Čas do</span>
          <input name="toTime" type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[180px] flex-1 text-sm">
          <span className="mb-1 block text-[#1a4d47]">Kontaktní osoba</span>
          <input name="contactName" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[160px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Telefon</span>
          <input name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[120px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Počet balíků</span>
          <input name="parcelCount" type="number" min={1} defaultValue={1} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[120px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Váha (kg)</span>
          <input name="totalWeight" type="number" min={0.1} step={0.1} defaultValue={1} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[260px] flex-1 text-sm">
          <span className="mb-1 block text-[#1a4d47]">Poznámka pro řidiče</span>
          <input name="note" className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Volitelně" />
        </label>
        <button className="rounded-lg bg-[#6f2147] px-4 py-2 text-white">Objednat DPD svoz</button>
      </form>
      <div className="mt-3 space-y-1 text-sm text-[#1a4d47]">
        {dpdPickups.slice(0, 5).map((p) => (
          <form key={p.id} action={cancelDpdPickupAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="pickupId" value={p.pickupId} />
            {new Date(p.createdAt).toLocaleString("cs-CZ")} · {p.pickupId}
            {p.pickupDate ? ` · ${p.pickupDate}` : ""} · {p.status}
            {p.note ? ` · ${p.note}` : ""}
            <ConfirmSubmitButton
              className="rounded border px-2 py-1"
              label="Stornovat svoz v DPD"
              confirmMessage="Tato akce se pokusi stornovat svoz v DPD. Pokracovat?"
            />
          </form>
        ))}
      </div>
      <form
        id="dpd-bulk-form-hu"
        action="/api/hu-admin/dpd-bulk-label"
        method="get"
        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3"
      >
        <p className="min-w-[320px] flex-1 text-sm text-[#1a4d47]">
          Vyber objednavky pres checkbox ve sloupci &quot;Vybrat&quot; a klikni na bulk tisk.
        </p>
        <button className="rounded-lg bg-[#6f2147] px-4 py-2 text-white">Stáhnout bulk DPD štítky</button>
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
                    form="dpd-bulk-form-hu"
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
                  <a href={`/api/hu-admin/dpd-label?orderId=${encodeURIComponent(o.id)}`} className="text-[#6f2147] hover:underline">
                    Stáhnout DPD štítek
                  </a>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <a
                      href={`/api/hu-admin/dpd-diagnostic?orderId=${encodeURIComponent(o.id)}&debug=1`}
                      className="rounded border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      DPD servisní diagnostika
                    </a>
                    <form action={cancelDpdShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-2 py-1"
                        label="Zrušit DPD zásilku"
                        confirmMessage="Tímto rušíš pouze zásilku u dopravce. Objednávka v e-shopu zůstane."
                      />
                    </form>
                    <form action={deleteDpdShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-2 py-1"
                        label="Lokální reset DPD"
                        confirmMessage="Tato akce pouze vycisti lokalni DPD data v e-shopu. Zasilka v DPD tim nemusi byt zrusena."
                      />
                    </form>
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
