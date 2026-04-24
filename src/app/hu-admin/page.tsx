import { AdminOrdersList } from "@/components/admin-orders-list";
import { autoCancelExpiredOrders, getRecentAdminAuditLogs, readStore, writeStore } from "@/lib/store";
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

export default async function HuAdminPage() {
  await autoCancelExpiredOrders();
  const [store, auditLogs] = await Promise.all([readStore("HU"), getRecentAdminAuditLogs("HU", 20)]);
  const waitingPayment = store.orders.filter((o) => o.status === "ORDERED_NOT_PAID").length;
  const readyToShip = store.orders.filter((o) => o.status === "ORDERED_PAID_NOT_SHIPPED").length;
  const inDelivery = store.orders.filter((o) => o.status === "WAITING_FOR_SHIPPING").length;
  const shipped = store.orders.filter((o) => o.status === "SHIPPED").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-[#0a2624]">HU rendelesi admin</h1>
      <p className="mt-1 text-[#1a4d47]">Kulon kezelt megrendelesek a szenzorvasarlas.hu oldalrol.</p>
      <form action={logoutAction} className="mt-3">
        <button className="rounded-lg border-2 border-[#0d4f4a]/20 bg-white px-3 py-1.5 text-sm text-[#0a2624]">
          Kijelentkezes
        </button>
      </form>
      <p className="mt-4 font-medium text-[#0a2624]">Aktualis keszlet: {store.inventory} db</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Fizetesre var</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{waitingPayment}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Fizetett / csomagolas</p>
          <p className="mt-1 text-2xl font-bold text-indigo-900">{readyToShip}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Feldolgozas alatt</p>
          <p className="mt-1 text-2xl font-bold text-sky-900">{inDelivery}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Feladva</p>
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
          Keszlet frissites
        </button>
      </form>

      <a href="/api/hu-admin/export" className="mt-4 inline-block text-sm font-medium text-[#0f766e] hover:underline">
        CSV export
      </a>

      <div className="mt-10">
        <AdminOrdersList orders={store.orders} locale="hu-HU" currency="HUF" detailsBasePath="/hu-admin/orders" />
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Ertesitesi e-mailek (naplo)</h2>
      <div className="mt-4 space-y-3">
        {store.notifications.map((n) => (
          <div key={n.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="font-medium">{n.subject}</p>
            <p>Cimzett: {n.to}</p>
            <p>{n.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Admin muveleti naplo</h2>
      <div className="mt-4 space-y-2">
        {auditLogs.map((row) => (
          <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="font-semibold text-[#0a2624]">{row.action}</p>
            <p className="text-[#1a4d47]">
              {new Date(row.createdAt).toLocaleString("hu-HU")}
              {row.orderNumber ? ` · #${String(row.orderNumber).padStart(7, "0")}` : ""}
            </p>
            {row.details ? <p className="text-[#1a4d47]">{row.details}</p> : null}
          </div>
        ))}
      </div>
    </main>
  );
}
