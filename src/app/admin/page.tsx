import { autoCancelExpiredOrders, readStore, updateOrderStatus, writeStore } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/types";
import { revalidatePath } from "next/cache";

async function updateStatus(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "") as (typeof ORDER_STATUSES)[number];
  if (ORDER_STATUSES.includes(status)) {
    await updateOrderStatus(orderId, status);
  }
  revalidatePath("/admin");
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

export default async function AdminPage() {
  await autoCancelExpiredOrders();
  const store = await readStore();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Administrare comenzi</h1>
      <p className="mt-2">Stoc curent: {store.inventory} buc.</p>

      <form action={updateInventory} className="mt-4 flex max-w-sm gap-2">
        <input
          type="number"
          name="inventory"
          defaultValue={store.inventory}
          className="w-full rounded border p-2"
        />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
          Actualizeaza stoc
        </button>
      </form>

      <a href="/api/admin/export" className="mt-4 inline-block text-sm">
        Export CSV (Excel / Google Sheets)
      </a>

      <div className="mt-8 space-y-4">
        {store.orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">
              {order.customerName} - {order.quantity} x senzor
            </p>
            <p className="text-sm text-slate-600">
              {order.email} | {order.phone} | {order.totalPrice} RON
            </p>
            <p className="text-sm text-slate-600">Status curent: {order.status}</p>
            <form action={updateStatus} className="mt-3 flex gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="status" defaultValue={order.status} className="rounded border p-2">
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-white">
                Salveaza
              </button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Notificari e-mail (simulare)</h2>
      <div className="mt-4 space-y-3">
        {store.notifications.map((n) => (
          <div key={n.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="font-medium">{n.subject}</p>
            <p>Catre: {n.to}</p>
            <p>{n.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
