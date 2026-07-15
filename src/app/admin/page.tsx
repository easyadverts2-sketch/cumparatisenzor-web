import { AdminOrdersList } from "@/components/admin-orders-list";
import { AdminProductListings } from "@/components/admin-product-listings";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EuAdminPage } from "@/components/eu-admin-page";
import {
  autoCancelExpiredOrders,
  addProductToMarket,
  cancelDpdPickupOrder,
  cancelDpdShipmentForOrder,
  cancelPplShipmentForOrder,
  cancelPplPickupOrder,
  getDpdPickups,
  getDpdShipmentsAdmin,
  getPplPickups,
  getPplBulkLabelForOrders,
  getPplShipmentsAdmin,
  listFailedStripeWebhookEvents,
  listListingsForMarket,
  listPendingCardCheckoutsForRecovery,
  orderDpdPickup,
  orderPplPickup,
  recoverPendingCardPayment,
  resetDpdShipmentForOrder,
  resetPplShipmentForOrder,
  readStore,
  updateMarketShipping,
  updateMarketStoreSettings,
  updateOrderStatus,
  upsertProductListing,
} from "@/lib/store";
import { formatOrderNumber } from "@/lib/order-format";
import { ORDER_STATUSES } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { clearAdminSessionCookie } from "@/lib/auth";
import { headers } from "next/headers";
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

async function updateStoreSettingsAction(formData: FormData) {
  "use server";
  const inventory = Number(formData.get("inventory"));
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const shipping = Number(String(formData.get("shipping") ?? "").replace(",", "."));
  const res = await updateMarketStoreSettings("RO", { inventory, price, shipping });
  revalidatePath("/admin");
  if (!res.ok) {
    redirect(`/admin?ok=0&msg=${encodeURIComponent(res.message)}`);
  }
  redirect(`/admin?ok=1&msg=${encodeURIComponent("Nastaveni obchodu (RO) ulozeno.")}`);
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
  const ok = await resetPplShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+udaje+lokalne+vycisteny" : "Lokalni+reset+PPL+selhal"}`);
}

async function cancelShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelPplShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "PPL+zasilka+zrusena" : "PPL+zruseni+zasilky+selhalo"}`);
}

async function orderPickupAction(formData: FormData) {
  "use server";
  const result = await orderPplPickup("RO", {
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
  const result = await cancelPplPickupOrder(pickupId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${result.ok ? "1" : "0"}&msg=${encodeURIComponent(result.message)}`);
}

async function cancelDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await cancelDpdShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+zasilka+resetovana+lokalne" : "DPD+reset+selhal"}`);
}

async function deleteDpdShipmentAction(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin?ok=0&msg=Chybi+ID+objednavky");
  const ok = await resetDpdShipmentForOrder(orderId, "RO");
  revalidatePath("/admin");
  redirect(`/admin?ok=${ok ? "1" : "0"}&msg=${ok ? "DPD+udaje+lokalne+vycisteny" : "Lokalni+reset+DPD+selhal"}`);
}

async function orderDpdPickupAction(formData: FormData) {
  "use server";
  const shipmentIds = String(formData.get("shipmentIds") || "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^\d+$/.test(v));
  const result = await orderDpdPickup("RO", {
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
  const result = await cancelDpdPickupOrder(pickupId, "RO");
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
  const path = await getPplBulkLabelForOrders(orderIds, "RO");
  revalidatePath("/admin");
  if (path) revalidatePath(path);
  redirect(`/admin?ok=${path ? "1" : "0"}&msg=${path ? "PPL+bulk+stitky+vygenerovany" : "PPL+bulk+stitky+selhaly"}`);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { ok?: string; msg?: string; cardEmail?: string };
}) {
  if (headers().get("x-site-variant") === "eu") {
    return <EuAdminPage searchParams={searchParams} />;
  }

  await autoCancelExpiredOrders();
  const cardEmail = String(searchParams?.cardEmail || "").trim();
  const [store, euStore, euListings, pplShipments, pickups, dpdShipments, dpdPickups, pendingCards, failedStripeWebhooks] =
    await Promise.all([
    readStore(),
    readStore("EU"),
    listListingsForMarket("EU"),
    getPplShipmentsAdmin("RO", 100),
    getPplPickups("RO", 20),
    getDpdShipmentsAdmin("RO", 100),
    getDpdPickups("RO", 20),
    listPendingCardCheckoutsForRecovery(
      cardEmail ? { email: cardEmail, limit: 50 } : { limit: 30 }
    ),
    listFailedStripeWebhookEvents(15),
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
      <p className="mt-4 font-medium text-[#0a2624]">
        Aktuálně: sklad {store.inventory} ks · cena {store.price} RON · standardní doprava {store.shipping} RON
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

      <form action={updateStoreSettingsAction} className="mt-4 max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2624]">Sklad a ceny (RO)</h2>
        <p className="text-sm text-[#1a4d47]">
          Tyto hodnoty se pouzivaji na webu i pri vytvareni objednavky. Fineship zustava{" "}
          <strong>200 RON</strong> (od 6 ks), zdarma od 5 ks u PPL/DPD jako dosud.
        </p>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Sklad (ks)</span>
          <input
            name="inventory"
            type="number"
            min={0}
            defaultValue={store.inventory}
            className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2 text-[#0a2624]"
          />
        </label>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Cena za kus (RON)</span>
          <input
            name="price"
            type="number"
            min={0.01}
            step={0.01}
            defaultValue={store.price}
            className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2 text-[#0a2624]"
          />
        </label>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Standardni doprava PPL/DPD pod 5 ks (RON)</span>
          <input
            name="shipping"
            type="number"
            min={0}
            step={0.01}
            defaultValue={store.shipping}
            className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2 text-[#0a2624]"
          />
        </label>
        <button type="submit" className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">
          Ulozit nastaveni
        </button>
      </form>

      <a
        href="/api/admin/export"
        className="mt-4 inline-block text-sm font-medium text-[#0f766e] hover:underline"
      >
        Export CSV (Excel / Sheets)
      </a>

      <div className="mt-10 rounded-xl border-2 border-rose-200 bg-rose-50/60 p-5">
        <h2 className="text-xl font-semibold text-rose-950">Platby kartou bez objednavky (Stripe)</h2>
        <p className="mt-2 text-sm text-rose-900">
          Pokud zakaznik zaplatil kartou, ale objednavka v adminu chybi, data jsou casto ulozena v pending checkoutu.
          U uspesne platby ve Stripe kliknete <strong>Obnovit objednavku</strong>.
        </p>
        <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-[260px] text-sm">
            <span className="mb-1 block text-rose-900">Hledat podle e-mailu</span>
            <input
              name="cardEmail"
              type="email"
              defaultValue={cardEmail}
              placeholder="napr. keripeti@gmail.com"
              className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
            Hledat
          </button>
          {cardEmail ? (
            <a href="/admin" className="text-sm text-rose-800 underline">
              Zrusit filtr
            </a>
          ) : null}
        </form>

        {failedStripeWebhooks.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-semibold">Selhale Stripe webhooky ({failedStripeWebhooks.length})</p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {failedStripeWebhooks.slice(0, 5).map((w) => (
                <li key={w.eventId}>
                  {w.createdAt.slice(0, 19)} · {w.status} · {w.lastError || w.eventType}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {pendingCards.length === 0 ? (
          <p className="mt-4 text-sm text-rose-800">
            {cardEmail
              ? `Zadny pending checkout pro e-mail ${cardEmail}.`
              : "Zadne nevyrizene pending checkouty bez objednavky."}
          </p>
        ) : (
          <div className="mt-4 overflow-auto rounded-lg border border-rose-200 bg-white">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-rose-100/80">
                <tr>
                  <th className="px-3 py-2">Datum</th>
                  <th className="px-3 py-2">Trh</th>
                  <th className="px-3 py-2">Zakaznik</th>
                  <th className="px-3 py-2">Adresa</th>
                  <th className="px-3 py-2">Ks / castka</th>
                  <th className="px-3 py-2">Stripe</th>
                  <th className="px-3 py-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {pendingCards.map((p) => (
                  <tr key={p.id} className="border-t border-rose-100 align-top">
                    <td className="px-3 py-2 whitespace-nowrap">{p.createdAt.slice(0, 19).replace("T", " ")}</td>
                    <td className="px-3 py-2">{p.market}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.customerName || "—"}</div>
                      <div>{p.email}</div>
                      <div className="text-xs text-slate-600">{p.phone}</div>
                    </td>
                    <td className="px-3 py-2 max-w-[320px] whitespace-pre-wrap text-xs">{p.deliveryAddress}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {p.quantity} ks · {p.totalPrice}
                      <div className="text-xs text-slate-600">{p.shippingCarrier}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div>{p.stripeStatus || "—"}</div>
                      <div className="font-mono">{p.stripePaymentIntentId || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {p.orderId ? (
                        <span className="text-emerald-700">Uz ma objednavku</span>
                      ) : p.stripeStatus === "succeeded" ? (
                        <form action={recoverCardPendingAction}>
                          <input type="hidden" name="pendingId" value={p.id} />
                          <button type="submit" className="rounded border border-rose-300 bg-white px-2 py-1 text-rose-900 hover:bg-rose-50">
                            Obnovit objednavku
                          </button>
                        </form>
                      ) : (
                        <span className="text-slate-500">Ceka na platbu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <AdminOrdersList
          orders={store.orders}
          deleteApiPath="/api/admin/order-hard-delete"
          statusApiPath="/api/admin/status"
          docxExportApiPath="/api/admin/export/docx"
        />
      </div>

      <h2 className="mt-16 text-2xl font-semibold text-[#0a2624]">Trh EU (kupitsensor.eu)</h2>
      <p className="mt-1 text-sm text-[#1a4d47]">
        Doprava {euStore.shipping} EUR · Fineship 30 EUR (od 6 ks) · sklad a ceny nyni per produkt nize
      </p>
      <form action={updateEuShippingAction} className="mt-4 max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-[#0a2624]">Doprava (EU)</h3>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Standardni doprava PPL/DPD pod 5 ks (EUR)</span>
          <input name="shipping" type="number" min={0} step={0.01} defaultValue={euStore.shipping} className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2" />
        </label>
        <button type="submit" className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">Ulozit dopravu EU</button>
      </form>

      <h3 className="mt-8 text-lg font-semibold text-[#0a2624]">Produkty a sklad (EU)</h3>
      <AdminProductListings
        market="EU"
        listings={euListings}
        updateListingAction={updateEuListingAction}
        addProductAction={addEuProductAction}
      />

      <div className="mt-6">
        <AdminOrdersList orders={euStore.orders} locale="de-DE" currency="EUR" />
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
                <td className="px-3 py-2 max-w-[420px] whitespace-normal break-words">{o.deliveryAddress.replaceAll("\n", ", ")}</td>
                <td className="px-3 py-2">{validTracking(o.trackingNumber || o.pplShipmentId)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <a href={`/api/admin/ppl-label?orderId=${encodeURIComponent(o.id)}`} className="rounded border px-2 py-1">Tisk štítku</a>
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
        <label className="min-w-[220px] text-sm">
          <span className="mb-1 block text-[#1a4d47]">E-mail</span>
          <input name="contactEmail" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
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
        <label className="min-w-[260px] flex-1 text-sm">
          <span className="mb-1 block text-[#1a4d47]">Shipment IDs (volitelně)</span>
          <input
            name="shipmentIds"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="napr. 58259823,58259824"
          />
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
        id="dpd-bulk-form-ro"
        action="/api/admin/dpd-bulk-label"
        method="get"
        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3"
      >
        <p className="min-w-[320px] flex-1 text-sm text-[#1a4d47]">
          Vyber objednavky pres checkbox ve sloupci &quot;Vybrat&quot; a klikni na bulk tisk.
        </p>
        <button className="rounded-lg bg-[#6f2147] px-4 py-2 text-white">
          Stáhnout bulk DPD štítky
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
                  <a href={`/api/admin/dpd-label?orderId=${encodeURIComponent(o.id)}`} className="text-[#6f2147] hover:underline">
                    Stáhnout DPD štítek
                  </a>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <a
                      href={`/api/admin/dpd-diagnostic?orderId=${encodeURIComponent(o.id)}&debug=1`}
                      className="rounded border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      DPD servisní diagnostika
                    </a>
                    <form action={cancelDpdShipmentAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-2 py-1"
                        label="Reset DPD zásilky"
                        confirmMessage="Vzhledem k omezení dokumentace DPD Shipping API proběhne bezpečný lokální reset DPD údajů pro tuto objednávku."
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
