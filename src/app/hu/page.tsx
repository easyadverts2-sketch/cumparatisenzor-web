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

      <section className="relative -mt-8 mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border-2 border-[#de6a44]/25 bg-white p-8 shadow-xl md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c] md:text-3xl">Mi a FreeStyle Libre 2 Plus?</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
            A FreeStyle Libre 2 Plus egy folyamatos glukozmonitorozasi rendszer (CGM): egy kis szenzor a karon,
            amely akar <strong className="text-[#042f2c]">15 napig</strong> koveti az ertekeket, es az adatok
            telefonon vagy dedikalt olvason is megjelennek.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
            A rendszer segit atlathatobban kezelni a mindennapi glukozvaltozasokat, kevesebb ujjszuras mellett,
            jobb napi rutinnal es tisztabb trendekkel.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: "🔔",
                title: "Riasztas magas/alacsony ertekre",
                text: "Szemelyre szabott jelzesek segitik a gyors reagalast.",
              },
              {
                icon: "📱",
                title: "Gyors leolvasas",
                text: "Telefonon vagy olvason egyszeruen kovethetoek az adatok.",
              },
              {
                icon: "📈",
                title: "Trendek az alkalmazasban",
                text: "A napi gorbek es elozmenyek jobban tamogatjak a donteseket.",
              },
              {
                icon: "🩹",
                title: "Kevesebb mindennapi szuras",
                text: "A folyamatos monitorozas kenyelmesebb rutint tesz lehetove.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#de6a44]/30 bg-gradient-to-br from-[#fff4ec] to-white p-5 shadow-sm"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f8d9c4] text-lg">
                  {item.icon}
                </span>
                <h3 className="mt-3 font-semibold text-[#042f2c]">{item.title}</h3>
                <p className="mt-2 text-[#14534d]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <div className="why-split-panel relative overflow-hidden rounded-3xl border border-[#b44b67]/25 bg-gradient-to-br from-[#6f2147] via-[#9d2f56] to-[#d45a40] p-6 text-white shadow-2xl md:p-8">
          <div className="why-split-glow why-split-glow-one" />
          <div className="why-split-glow why-split-glow-two" />
          <div className="relative grid gap-6 lg:grid-cols-[1.05fr_1.35fr] lg:items-stretch">
            <div className="rounded-2xl border border-white/25 bg-black/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#ffd8be]">Gyakorlati elonyok</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Miert a szenzorvasarlas.hu?</h2>
              <p className="mt-4 text-base leading-relaxed text-white/90 md:text-lg">
                Gyors kiszallitas, eredeti termekek es magyar nyelvu tamogatas - atlathato rendelessel.
              </p>
              <Link
                href="/hu/comanda"
                className="mt-7 inline-flex rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#8f2c53] no-underline shadow-lg transition hover:bg-[#fff1e6]"
              >
                Rendeles
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                { id: "01", title: "Gyors EU-szallitas", detail: "2-5 nap", icon: "🚚" },
                { id: "02", title: "Eredeti szenzorok", detail: "bontatlan csomagolas", icon: "📦" },
                { id: "03", title: "Magyar nyelvu tamogatas", detail: "gyors valasz ugyfelszolgalat", icon: "🇭🇺" },
                { id: "04", title: "Egyszeru fizetes", detail: "utanvet vagy atutalas", icon: "💳" },
              ].map((item, idx) => (
                <article
                  key={item.id}
                  className="why-split-card group rounded-2xl border border-white/25 bg-white/12 p-5 shadow-lg backdrop-blur-md"
                  style={{ animationDelay: `${idx * 110}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold text-[#ffe2c8]">{item.id}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold leading-snug md:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-base font-medium text-white/90">{item.detail}</p>
                </article>
              ))}
            </div>
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
