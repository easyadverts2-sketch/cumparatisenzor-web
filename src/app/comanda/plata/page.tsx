import Link from "next/link";

export const metadata = {
  title: "Plata prin transfer | Senzori Libre Romania",
};

function getBankConfig() {
  return {
    iban: process.env.BANK_IBAN || "(configurati BANK_IBAN in Vercel)",
    accountName: process.env.BANK_ACCOUNT_NAME || "Česká maloobchodní s.r.o.",
    bankName: process.env.BANK_NAME || "",
    bic: process.env.BANK_BIC || "",
    referenceNote:
      process.env.BANK_PAYMENT_NOTE ||
      "Mentionati numarul comenzii in detaliile platii / referinta platii.",
  };
}

export default function PlataPage({
  searchParams,
}: {
  searchParams: { nr?: string };
}) {
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "—";
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
              <dt className="text-sm font-medium text-[#0f766e]">Referinta / detalii plata</dt>
              <dd>
                Comanda {nr} — {bank.referenceNote}
              </dd>
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
