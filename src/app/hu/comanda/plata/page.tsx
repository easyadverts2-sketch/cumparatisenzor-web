import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { getLatestInvoiceByOrderNumber, getOrderByNumber } from "@/lib/store";

export const metadata: Metadata = {
  title: "Banki atutalas",
  robots: NOINDEX_PAGE,
};

function getBankConfig() {
  return {
    iban: "CZ11 0800 0000 0022 1394 5293",
    accountName: "Ceska maloobchodni s.r.o.",
    bankName: "",
    bic: "GIBACZPX",
  };
}

export default async function HuPaymentPage({
  searchParams,
}: {
  searchParams: { nr?: string };
}) {
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "-";
  const orderNumber = Number(nrRaw);
  const order = Number.isFinite(orderNumber)
    ? await getOrderByNumber(orderNumber, "HU")
    : null;
  const proforma = Number.isFinite(orderNumber)
    ? await getLatestInvoiceByOrderNumber(orderNumber, "HU", "PROFORMA")
    : null;
  const bank = getBankConfig();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-3xl border-2 border-[#0d9488]/30 bg-gradient-to-b from-[#e6f7f4] to-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#0a2624]">Rendeles rogzitve - banki atutalas</h1>
        <p className="mt-2 font-semibold text-[#0f766e]">Rendelesszam: {nr}</p>
        <div className="mt-8 rounded-2xl border-2 border-[#0d4f4a]/15 bg-white p-6 text-left">
          <h2 className="font-semibold text-[#0a2624]">Utalasi adatok</h2>
          <p className="mt-2 text-[#1a4d47]"><strong>Kedvezmenyezett:</strong> {bank.accountName}</p>
          <p className="text-[#1a4d47]"><strong>IBAN:</strong> {bank.iban}</p>
          {bank.bankName ? <p className="text-[#1a4d47]"><strong>Bank:</strong> {bank.bankName}</p> : null}
          {bank.bic ? <p className="text-[#1a4d47]"><strong>BIC:</strong> {bank.bic}</p> : null}
          <p className="mt-2 text-[#1a4d47]">
            <strong>Fizetendo osszeg:</strong> {order ? `${order.totalPrice} HUF` : "-"}
          </p>
          <p className="mt-2 text-[#1a4d47]">
            <strong>Valtozo szam / kozlemeny:</strong> {proforma ? proforma.variable_symbol : `Rendeles ${nr}`}
          </p>
          {proforma ? (
            <p className="mt-2 text-sm text-[#1a4d47]">
              <strong>Proforma:</strong> {proforma.invoice_no}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#9a3412]">
              A proforma most keszul. Ha 1-2 percen belul sem erkezik meg emailben, jelezd nekunk.
            </p>
          )}
        </div>
        <Link href="/hu" className="mt-8 inline-block rounded-xl bg-[#0d9488] px-8 py-3 font-semibold text-white no-underline hover:bg-[#0f766e]">
          Vissza a fooldalra
        </Link>
      </div>
    </main>
  );
}
