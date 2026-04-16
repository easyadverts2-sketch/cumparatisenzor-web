import { AdminOrdersList } from "@/components/admin-orders-list";
import { autoCancelExpiredOrders, readStore, writeStore } from "@/lib/store";
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
  const store = await readStore("HU");

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
    </main>
  );
}
