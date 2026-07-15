import type { Market } from "@/lib/types";
import type { ProductListingSummary } from "@/lib/store";

type Props = {
  market: Market;
  listings: ProductListingSummary[];
  updateListingAction: (formData: FormData) => void | Promise<void>;
  addProductAction: (formData: FormData) => void | Promise<void>;
};

/**
 * Market-parameterized, not duplicated per market — same reuse pattern as
 * OrderFormEu's `locale` prop and eu-home-page.tsx's `locale` prop. Only
 * wired into the EU admin section today (EU is the only market with more
 * than one product listing), but works for any market without changes.
 */
export function AdminProductListings({ market, listings, updateListingAction, addProductAction }: Props) {
  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[#0a2624]">
              <th className="p-3 font-semibold">Produkt</th>
              <th className="p-3 font-semibold">SKU</th>
              <th className="p-3 font-semibold">Cena</th>
              <th className="p-3 font-semibold">Sklad</th>
              <th className="p-3 font-semibold">Aktivni</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[#1a4d47]">
                  Zatim zadny produkt pro tento trh.
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="border-b border-slate-100 last:border-0">
                  <td colSpan={6} className="p-0">
                    <form
                      action={updateListingAction}
                      className="grid grid-cols-6 items-center gap-2 p-3"
                    >
                      <input type="hidden" name="productId" value={listing.productId} />
                      <span className="font-medium text-[#0a2624]">{listing.name}</span>
                      <span className="text-[#1a4d47]">{listing.sku}</span>
                      <input
                        name="price"
                        type="number"
                        min={0}
                        step={0.01}
                        defaultValue={listing.price}
                        className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-1.5"
                      />
                      <input
                        name="inventory"
                        type="number"
                        min={0}
                        defaultValue={listing.inventory}
                        className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-1.5"
                      />
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="isActive" defaultChecked={listing.isActive} />
                        <span className="text-xs text-[#1a4d47]">aktivni</span>
                      </label>
                      <button type="submit" className="rounded-lg bg-[#0f766e] px-3 py-1.5 text-white">
                        Ulozit
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        action={addProductAction}
        className="max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h4 className="text-base font-semibold text-[#0a2624]">Pridat novy produkt ({market})</h4>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Nazev</span>
          <input name="name" required className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2" />
        </label>
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">SKU</span>
          <input name="sku" required className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-[#0a2624]">
            <span className="mb-1 block text-[#1a4d47]">Cena</span>
            <input name="price" type="number" min={0} step={0.01} required className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2" />
          </label>
          <label className="block text-sm font-medium text-[#0a2624]">
            <span className="mb-1 block text-[#1a4d47]">Sklad</span>
            <input name="inventory" type="number" min={0} required className="w-full rounded-lg border-2 border-[#0d4f4a]/20 p-2" />
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-[#0f766e] px-4 py-2 text-white">
          Pridat produkt
        </button>
      </form>
    </div>
  );
}
