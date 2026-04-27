import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { getLatestInvoiceByOrderNumber, getOrderByNumber } from "@/lib/store";

export const metadata: Metadata = {
  title: "Plata prin transfer bancar",
  robots: NOINDEX_PAGE,
};

function getBankConfig() {
  return {
    iban: "CZ03 0100 0000 0001 1076 4124",
    accountName: "Česká Maloobchodní s.r.o.",
    bankName: "",
    bic: "KOMBCZPP",
  };
}

export default async function PlataPage({
  searchParams,
}: {
  searchParams: { nr?: string };
}) {
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "—";
  const orderNumber = Number(nrRaw);
  const order = Number.isFinite(orderNumber)
    ? await getOrderByNumber(orderNumber, "RO")
    : null;
  const proforma = Number.isFinite(orderNumber)
    ? await getLatestInvoiceByOrderNumber(orderNumber, "RO", "PROFORMA")
    : null;
  const bank = getBankConfig();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-3xl border-2 border-[#0d9488]/30 bg-gradient-to-b from-[#e6f7f4] to-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#0a2624]">Comanda inregistrata — plata prin transfer</h1>
        <p className="mt-2 font-semibold text-[#0f766e]">Numar comanda: {nr}</p>
        <p className="mt-4 text-[#1a4d47]">
          Expediem dupa ce primim plata in contul nostru. Aceste date vi le trimitem si prin e-mail;
          pastrati numarul comenzii pentru referinta.
        </p>

        <div className="mt-8 rounded-2xl border-2 border-[#0d4f4a]/15 bg-white p-6 text-left">
          <h2 className="font-semibold text-[#0a2624]">Date pentru plata</h2>
          <dl className="mt-4 space-y-3 text-[#1a4d47]">
            <div>
              <dt className="text-sm font-medium text-[#0f766e]">Beneficiar</dt>
              <dd className="font-medium text-[#0a2624]">{bank.accountName}</dd>
            </div>
            {bank.bankName ? (
              <div>
                <dt className="text-sm font-medium text-[#0f766e]">Banca</dt>
                <dd>{bank.bankName}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm font-medium text-[#0f766e]">IBAN</dt>
              <dd className="break-all font-mono text-base text-[#0a2624]">{bank.iban}</dd>
            </div>
            {bank.bic ? (
              <div>
                <dt className="text-sm font-medium text-[#0f766e]">BIC / SWIFT</dt>
                <dd className="font-mono">{bank.bic}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm font-medium text-[#0f766e]">Suma de plata</dt>
              <dd className="font-semibold text-[#0a2624]">{order ? `${order.totalPrice} RON` : "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#0f766e]">Simbol variabil</dt>
              <dd>{proforma ? proforma.variable_symbol : `Comanda ${nr}`}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-sm text-[#1a4d47]">
          Daca nu vedeti e-mailul in cateva minute, verificati folderul Spam. Pentru intrebari,
          scrieti-ne de la adresa folosita la comanda.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-[#0d9488] px-8 py-3 font-semibold text-white no-underline hover:bg-[#0f766e]"
        >
          Inapoi la pagina principala
        </Link>
      </div>
    </main>
  );
}
