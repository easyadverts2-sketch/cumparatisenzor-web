import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Koszonjuk a rendelest",
  robots: NOINDEX_PAGE,
};

export default function HuThanksPage({
  searchParams,
}: {
  searchParams: { nr?: string };
}) {
  const nr = searchParams.nr || "";
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="rounded-3xl border-2 border-[#0d9488]/30 bg-gradient-to-b from-[#e6f7f4] to-white px-8 py-12 shadow-lg">
        <h1 className="mt-2 text-2xl font-bold text-[#0a2624]">Koszonjuk rendelest!</h1>
        {nr ? <p className="mt-3 text-lg font-semibold text-[#0f766e]">Rendelesszam: {nr.padStart(7, "0")}</p> : null}
        <p className="mt-6 text-[#1a4d47]">A rendelest rogzitettuk, hamarosan kuldjuk a visszaigazolo e-mailt.</p>
        <Link href="/hu" className="mt-8 inline-block rounded-xl bg-[#0d9488] px-8 py-3 font-semibold text-white no-underline hover:bg-[#0f766e]">
          Vissza a fooldalra
        </Link>
      </div>
    </main>
  );
}
