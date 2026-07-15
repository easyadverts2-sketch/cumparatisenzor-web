import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { getBankDetails } from "@/lib/billing";
import { getLatestInvoiceByOrderNumber, getOrderByNumber } from "@/lib/store";

export const metadata: Metadata = {
  title: "Банківський переказ",
  robots: NOINDEX_PAGE,
};

export default async function EuPaymentUaPage({
  searchParams,
}: {
  searchParams: { nr?: string };
}) {
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "-";
  const orderNumber = Number(nrRaw);
  const order = Number.isFinite(orderNumber) ? await getOrderByNumber(orderNumber, "EU") : null;
  const proforma = Number.isFinite(orderNumber)
    ? await getLatestInvoiceByOrderNumber(orderNumber, "EU", "PROFORMA")
    : null;
  const bank = getBankDetails("EU");

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-3xl border-2 border-[#0d9488]/30 bg-gradient-to-b from-[#e6f7f4] to-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#0a2624]">Замовлення прийнято — банківський переказ</h1>
        <p className="mt-2 font-semibold text-[#0f766e]">Номер замовлення: {nr}</p>
        <div className="mt-8 rounded-2xl border-2 border-[#0d4f4a]/15 bg-white p-6 text-left">
          <h2 className="font-semibold text-[#0a2624]">Реквізити для оплати</h2>
          <p className="mt-2 text-[#1a4d47]"><strong>Отримувач:</strong> {bank.accountName}</p>
          <p className="text-[#1a4d47]"><strong>IBAN:</strong> {bank.iban}</p>
          {bank.bic ? <p className="text-[#1a4d47]"><strong>BIC:</strong> {bank.bic}</p> : null}
          <p className="mt-2 text-[#1a4d47]">
            <strong>Сума:</strong> {order ? `${order.totalPrice} EUR` : "-"}
          </p>
          <p className="mt-2 text-[#1a4d47]">
            <strong>Призначення:</strong> {proforma ? proforma.variable_symbol : `Замовлення ${nr}`}
          </p>
          {proforma ? (
            <p className="mt-2 text-sm text-[#1a4d47]">
              <strong>Рахунок:</strong> {proforma.invoice_no}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#9a3412]">
              Рахунок готується. Якщо лист не прийде протягом 1–2 хвилин, напишіть нам.
            </p>
          )}
        </div>
        <Link href="/eu/ua" className="mt-8 inline-block rounded-xl bg-[#0d9488] px-8 py-3 font-semibold text-white no-underline hover:bg-[#0f766e]">
          На головну
        </Link>
      </div>
    </main>
  );
}
