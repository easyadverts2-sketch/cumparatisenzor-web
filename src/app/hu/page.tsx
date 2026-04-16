import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const huUrl = "https://szenzorvasarlas.hu";

export const metadata: Metadata = {
  title: "Szenzorvasarlas.hu - FreeStyle Libre 2 Plus",
  description: "FreeStyle Libre 2 Plus online rendeles Magyarorszagon, gyors EU szallitas, magyar nyelvu tamogatas.",
  alternates: { canonical: "/hu" },
  openGraph: {
    url: `${huUrl}/`,
    title: "Szenzorvasarlas.hu",
    description: "FreeStyle Libre 2 Plus megrendeles Magyarorszagra.",
  },
};

export default function HuHomePage() {
  return (
    <main className="pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6f2147] via-[#b23962] to-[#ee7a32] text-white">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              FreeStyle Libre 2 Plus - elerheto Magyarorszagon
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Folyamatos glukozmonitorozas mindennapi hasznalatra
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Egyszeru rendeles, magyar nyelvu kommunikacio es megbizhato szallitas Magyarorszagra.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/hu/comanda" className="rounded-xl bg-white px-6 py-3.5 font-semibold text-[#8f2c53] shadow-lg no-underline hover:bg-[#fff1e6]">
                Rendeles
              </Link>
              <Link href="/hu/despre-libre" className="rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3.5 font-semibold text-white no-underline backdrop-blur hover:bg-white/20">
                Hogyan mukodik
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <Image src="/libre-user.png" alt="FreeStyle Libre felhasznalo" width={1100} height={760} className="h-auto w-full rounded-xl object-cover" priority />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <div className="rounded-3xl border-2 border-[#de6a44]/25 bg-white p-8 shadow-xl md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c] md:text-3xl">Miert a szenzorvasarlas.hu?</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              "🚚 Gyors EU-szallitas (2-5 nap)",
              "📦 Eredeti, bontatlan szenzorok",
              "🇭🇺 Magyar nyelvu tamogatas",
              "💳 Egyszeru fizetes (utanvet vagy atutalas)",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#de6a44]/25 bg-[#fff4ec] px-4 py-3 text-base font-medium text-[#14534d]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <div className="rounded-3xl border-2 border-[#0d4f4a]/10 bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c]">LibreLink alkalmazas letoltese</h2>
          <p className="mt-3 text-[#14534d]">
            Magyarorszagon az app elerheto a hivatalos aruhazakban:
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=com.freestylelibre.app.hu"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#de6a44]/30 bg-[#fff4ec] px-5 py-3 font-semibold text-[#7a3f54] no-underline"
            >
              Google Play
            </a>
            <a
              href="https://apps.apple.com/hu/app/freestyle-librelink-hu/id1472262800"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#de6a44]/30 bg-[#fff4ec] px-5 py-3 font-semibold text-[#7a3f54] no-underline"
            >
              App Store
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
