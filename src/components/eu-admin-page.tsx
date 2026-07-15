import { AdminOrdersList } from "@/components/admin-orders-list";
import { AdminProductListings } from "@/components/admin-product-listings";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { clearAdminSessionCookie } from "@/lib/auth";
import { formatOrderNumber } from "@/lib/order-format";
import {
  addProductToMarket,
  autoCancelExpiredOrders,
  cancelDpdPickupOrder,
  cancelDpdShipmentForOrder,
  cancelPplPickupOrder,
  cancelPplShipmentForOrder,
  getDpdPickups,
  getDpdShipmentsAdmin,
  getPplBulkLabelForOrders,
  getPplPickups,
  getPplShipmentsAdmin,
  listListingsForMarket,
  listPendingCardCheckoutsForRecovery,
  orderDpdPickup,
  orderPplPickup,
  readStore,
  recoverPendingCardPayment,
  resetDpdShipmentForOrder,
  resetPplShipmentForOrder,
  updateMarketShipping,
  upsertProductListing,
} from "@/lib/store";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function validTracking(value: string | null | undefined) {
  const raw = String(value || "").trim();
  return /^\d{8,20}$/.test(raw) ? raw : "-";
}

async function updateEuShippingAction(formData: FormData) {
  "use server";
  const shipping = Number(String(formData.get("shipping") ?? "").replace(",", "."));
  const res = await updateMarketShipping("EU", shipping);
  revalidatePath("/admin");
  if (!res.ok) {
    redirect(`/admin?ok=0&msg=${encodeURIComponent(res.message)}`);
  }
  redirect(`/admin?ok=1&msg=${encodeURIComponent("Doprava (EU) ulozena.")}`);
}

async function updateEuListingAction(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") || "");
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const inventory = Number(formData.get("inventory"));
  const isActive = formData.get("isActive") === "on";
  const res = await upsertProductListing("EU", productId, { price, inventory, isActive });
  revalidatePath("/admin");
  if (!res.ok) {
    redirect(`/admin?ok=0&msg=${encodeURIComponent(res.message)}`);
  }
  redirect(`/admin?ok=1&msg=${encodeURIComponent("Produkt (EU) ulozen.")}`);
}

async function addEuProductAction(formData: FormData) {
  "use server";
  const sku = String(formData.get("sku") || "");
  const name = String(formData.get("name") || "");
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const inventory = Number(formData.get("inventory"));
  const res = await addProductToMarket("EU", { sku, name, price, inventory });
  revalidatePath("/admin");
  if (!res.ok) {
    redirect(`/admin?ok=0&msg=${encodeURIComponent(res.message)}`);
  }
  redirect(`/admin?ok=1&msg=${encodeURIComponent("Novy produkt (EU) pridan.")}`);
}

async function logoutAction() {
  "use server";
  clearAdminSessionCookie();
  redirect("/admin/login");
}

async function deleteShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await resetPplShipmentForOrder(orderId, "EU");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+udaje+lokalne+vycisteny" : "Lokalni+reset+PPL+selhal"}`);
}

async function cancelShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelPplShipmentForOrder(orderId, "EU");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+zasilka+zrusena" : "PPL+zruseni+zasilky+selhalo"}`);
}

async function orderPickupAction(formData: FormData) {
  "use server";
  const result = await orderPplPickup("EU", {
    pickupDate: String(formData.get("pickupDate") || "").trim(),
    fromTime: String(formData.get("fromTime") || "").trim(),
    toTime: String(formData.get("toTime") || "").trim(),
    contactName: String(formData.get("contactName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    shipmentCount: Number(formData.get("shipmentCount") || 1),
    note: String(formData.get("note") || "").trim(),
  });
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function cancelPickupAction(formData: FormData) {
  "use server";
  const pickupId = String(formData.get("pickupId") || "").trim();
  const result = await cancelPplPickupOrder(pickupId, "EU");
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function deleteDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await resetDpdShipmentForOrder(orderId, "EU");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+udaje+lokalne+vycisteny" : "Lokalni+reset+DPD+selhal"}`);
}

async function cancelDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelDpdShipmentForOrder(orderId, "EU");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+zasilka+zrusena" : "DPD+zruseni+zasilky+selhalo"}`);
}

async function orderDpdPickupAction(formData: FormData) {
  "use server";
  const shipmentIds = formData
    .getAll("shipmentIds")
    .map((v) => String(v || "").trim())
    .filter((v) => /^\d+$/.test(v));
  const result = await orderDpdPickup("EU", {
    pickupDate: String(formData.get("pickupDate") || "").trim(),
    fromTime: String(formData.get("fromTime") || "").trim(),
    toTime: String(formData.get("toTime") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    contactName: String(formData.get("contactName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim(),
    parcelCount: Number(formData.get("parcelCount") || 1),
    totalWeight: Number(formData.get("totalWeight") || 1),
    shipmentIds,
  });
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function cancelDpdPickupAction(formData: FormData) {
  "use server";
  const pickupId = String(formData.get("pickupId") || "").trim();
  const result = await cancelDpdPickupOrder(pickupId, "EU");
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function recoverCardPendingAction(formData: FormData) {
  "use server";
  const pendingId = String(formData.get("pendingId") || "").trim();
  const res = await recoverPendingCardPayment({ pendingId });
  revalidatePath("/admin");
  if (!res.ok) {
    redirect(`/admin?ok=0&msg=${encodeURIComponent(res.message)}`);
  }
  redirect(
    `/admin?ok=1&msg=${encodeURIComponent(
      `Obnoveno: objednavka #${formatOrderNumber(res.orderNumber)} (${res.market})`
    )}`
  );
}

async function bulkPplLabelsAction(formData: FormData) {
  "use server";
  const orderIds = formData
    .getAll("orderIds")
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const path = await getPplBulkLabelForOrders(orderIds, "EU");
  revalidatePath("/admin");
  if (path) revalidatePath(path);
  redirect(`/admin?ok=${path ? "1" : "0"}&msg=${path ? "PPL+bulk+stitky+vygenerovany" : "PPL+bulk+stitky+selhaly"}`);
}

export async function EuAdminPage({
  searchParams,
}: {
  searchParams?: { ok?: string; msg?: string; cardEmail?: string };
}) {
  await autoCancelExpiredOrders();
  const cardEmail = String(searchParams?.cardEmail || "").trim();
  const [euStore, euListings, pplShipments, pickups, dpdShipments, dpdPickups, pendingCardsRaw] = await Promise.all([
    readStore("EU"),
    listListingsForMarket("EU"),
    getPplShipmentsAdmin("EU", 100),
    getPplPickups("EU", 20),
    getDpdShipmentsAdmin("EU", 100),
    getDpdPickups("EU", 20),
    listPendingCardCheckoutsForRecovery(cardEmail ? { email: cardEmail, limit: 50 } : { limit: 30 }),
  ]);
  const pendingCards = pendingCardsRaw.filter((p) => p.market === "EU");

  const waitingPayment = euStore.orders.filter((o) => o.status === "ORDERED_NOT_PAID").length;
  const readyToShip = euStore.orders.filter((o) => o.status === "ORDERED_PAID_NOT_SHIPPED").length;
  const inDelivery = euStore.orders.filter((o) => o.status === "WAITING_FOR_SHIPPING").length;
  const shipped = euStore.orders.filter((o) => o.status === "SHIPPED").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-[#0a2624]">Administrace objednávek (EU)</h1>
      <p className="mt-1 text-[#1a4d47]">kupitsensor.eu — objednávky, sklad a doprava.</p>
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

      <p className="mt-4 font-medium text-[#0a2624]">
        Doprava {euStore.shipping} EUR · Fineship 30 EUR (od 6 ks) · ceny a sklad per produkt níže
      </p>
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

      <form action={updateEuShippingAction} className="mt-6 max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2624]">Doprava (EU)</h2>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Standardní doprava PPL/DPD pod 5 ks (EUR)</span>
          <input
            name="shipping"
            type="number"
            min={0}
            step={0.01}
            defaultValue={euStore.shipping}
            className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2"
          />
        </label>
        <button type="submit" className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">
          Uložit dopravu EU
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold text-[#0a2624]">Produkty a sklad (EU)</h2>
      <AdminProductListings
        market="EU"
        listings={euListings}
        updateListingAction={updateEuListingAction}
        addProductAction={addEuProductAction}
      />

      {pendingCards.length > 0 ? (
        <div className="mt-10 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
          <h2 className="text-lg font-semibold text-rose-900">Nedokončené platby kartou (EU)</h2>
          <div className="mt-3 overflow-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2">Datum</th>
                  <th className="px-3 py-2">Zákazník</th>
                  <th className="px-3 py-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {pendingCards.map((p) => (
                  <tr key={p.id} className="border-t border-rose-100">
                    <td className="px-3 py-2 whitespace-nowrap">{p.createdAt.slice(0, 19).replace("T", " ")}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.customerName || "—"}</div>
                      <div>{p.email}</div>
                    </td>
                    <td className="px-3 py-2">
                      {p.orderId ? (
                        <span className="text-emerald-700">Už má objednávku</span>
                      ) : p.stripeStatus === "succeeded" ? (
                        <form action={recoverCardPendingAction}>
                          <input type="hidden" name="pendingId" value={p.id} />
                          <button type="submit" className="rounded border border-rose-300 bg-white px-2 py-1">
                            Obnovit objednávku
                          </button>
                        </form>
                      ) : (
                        <span className="text-slate-500">Čeká na platbu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        <AdminOrdersList
          orders={euStore.orders}
          locale="de-DE"
          currency="EUR"
          deleteApiPath="/api/admin/order-hard-delete"
          statusApiPath="/api/admin/status"
          docxExportApiPath="/api/admin/export/docx"
        />
      </div>

      <h2 className="mt-12 text-2xl font-semibold">PPL zásilky a svozy (EU)</h2>
      <form action={orderPickupAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
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
        <label className="min-w-[180px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Kontakt</span>
          <input name="contactName" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[160px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Telefon</span>
          <input name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[200px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">E-mail</span>
          <input name="email" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[120px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Počet balíků</span>
          <input name="shipmentCount" type="number" min={1} defaultValue={1} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Objednat svoz</button>
      </form>
      <div className="mt-3 space-y-1 text-sm text-[#1a4d47]">
        {pickups.slice(0, 5).map((p) => (
          <form key={p.id} action={cancelPickupAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="pickupId" value={p.pickupId} />
            {new Date(p.createdAt).toLocaleString("cs-CZ")} · {p.pickupId} · {p.status}
            <ConfirmSubmitButton className="rounded border px-2 py-1" label="Zrušit svoz" confirmMessage="Zrušit svoz v PPL?" />
          </form>
        ))}
      </div>
      <form id="ppl-bulk-form-eu" action={bulkPplLabelsAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <p className="min-w-[320px] flex-1 text-sm text-[#1a4d47]">Vyber objednávky PPL a vygeneruj bulk štítky.</p>
        <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Vygenerovat bulk PPL štítky</button>
      </form>
      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Vybrat</th>
              <th className="px-3 py-2">Objednávka</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Adresa</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {pplShipments.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input type="checkbox" name="orderIds" value={o.id} form="ppl-bulk-form-eu" className="h-4 w-4" />
                </td>
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString("cs-CZ")}</td>
                <td className="px-3 py-2 max-w-[420px] whitespace-normal break-words">
                  {o.deliveryAddress.replaceAll("\n", ", ")}
                </td>
                <td className="px-3 py-2">{validTracking(o.trackingNumber || o.pplShipmentId)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <a href={`/api/admin/ppl-label?orderId=${encodeURIComponent(o.id)}`} className="rounded border px-2 py-1">
                      Tisk štítku
                    </a>
                    <form action={cancelShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton className="rounded border px-2 py-1" label="Zrušit PPL" confirmMessage="Zrušit zásilku u dopravce?" />
                    </form>
                    <form action={deleteShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton className="rounded border px-2 py-1" label="Lokální reset" confirmMessage="Jen vyčistit PPL data v e-shopu?" />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl font-semibold">DPD zásilky a svozy (EU)</h2>
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
        <label className="min-w-[180px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Kontakt</span>
          <input name="contactName" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[160px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">Telefon</span>
          <input name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="min-w-[220px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">E-mail</span>
          <input name="contactEmail" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Objednat DPD svoz</button>
      </form>
      <div className="mt-3 space-y-1 text-sm text-[#1a4d47]">
        {dpdPickups.slice(0, 5).map((p) => (
          <form key={p.id} action={cancelDpdPickupAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="pickupId" value={p.pickupId} />
            {new Date(p.createdAt).toLocaleString("cs-CZ")} · {p.pickupId} · {p.status}
            <ConfirmSubmitButton className="rounded border px-2 py-1" label="Zrušit svoz" confirmMessage="Zrušit DPD svoz?" />
          </form>
        ))}
      </div>
      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Objednávka</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {dpdShipments.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{String(o.orderNumber)}</td>
                <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString("cs-CZ")}</td>
                <td className="px-3 py-2">{validTracking(o.trackingNumber || o.dpdShipmentId)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <form action={cancelDpdShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton className="rounded border px-2 py-1" label="Zrušit DPD" confirmMessage="Zrušit DPD zásilku?" />
                    </form>
                    <form action={deleteDpdShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton className="rounded border px-2 py-1" label="Lokální reset" confirmMessage="Jen vyčistit DPD data?" />
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
