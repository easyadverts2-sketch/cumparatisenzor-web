import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Rezultat plata cu cardul",
  robots: NOINDEX_PAGE,
};

export default function PlataCardRezultatPage({
  searchParams,
}: {
  searchParams: { nr?: string; session_id?: string };
}) {
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "—";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-3xl border-2 border-[#0d9488]/30 bg-gradient-to-b from-[#e6f7f4] to-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#0a2624]">Multumim!</h1>
        <p className="mt-2 font-semibold text-[#0f766e]">Comanda nr. {nr}</p>
        <p className="mt-4 text-[#1a4d47]">
          Daca ati finalizat plata cu cardul pe pagina Stripe, veti primi in scurt timp un e-mail de
          confirmare a platii. Procesarea poate dura cateva minute.
        </p>
        <p className="mt-3 text-sm text-[#1a4d47]">
          Daca ati inchis fereastra inainte de plata, comanda ramane in asteptare — puteti reveni la
          formularul de comanda sau ne puteti scrie la{" "}
          <a className="font-medium text-[#0f766e] underline" href="mailto:info@cumparatisenzor.ro">
            info@cumparatisenzor.ro
          </a>
          .
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
