import Link from "next/link";

export const metadata = {
  title: "Multumim | Senzori Libre Romania",
};

export default function MultumescPage({
  searchParams,
}: {
  searchParams: { nr?: string };
}) {
  const nr = searchParams.nr || "";
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="rounded-3xl border-2 border-[#0d9488]/30 bg-gradient-to-b from-[#e6f7f4] to-white px-8 py-12 shadow-lg">
        <p className="text-5xl" aria-hidden>
          ✓
        </p>
        <h1 className="mt-4 text-2xl font-bold text-[#0a2624]">Va multumim pentru comanda!</h1>
        {nr ? (
          <p className="mt-3 text-lg font-semibold text-[#0f766e]">Comanda nr. {nr.padStart(7, "0")}</p>
        ) : null}
        <p className="mt-6 text-[#1a4d47]">
          Am inregistrat comanda. In curand veti primi un e-mail de confirmare cu detaliile. Echipa
          noastra va prelua solicitarea si va va tine la curent.
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
