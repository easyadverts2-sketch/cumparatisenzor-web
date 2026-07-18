import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLdSite } from "@/components/json-ld-site";

const huUrl = "https://szenzorvasarlas.hu";

export const metadata: Metadata = {
  title: "Szenzorvasarlas.hu - FreeStyle Libre 2 Plus",
  description: "FreeStyle Libre 2 Plus online rendeles Magyarorszagon, gyors szallitas, magyar nyelvu tamogatas.",
  alternates: {
    canonical: "/",
    languages: {
      "hu-HU": "https://szenzorvasarlas.hu/",
      "ro-RO": "https://cumparatisenzor.ro/",
      ru: "https://www.kupitsensor.eu/",
      "x-default": "https://cumparatisenzor.ro/",
    },
  },
  openGraph: {
    url: `${huUrl}/`,
    title: "Szenzorvasarlas.hu",
    description: "FreeStyle Libre 2 Plus megrendeles Magyarorszagra.",
  },
};

export default function HuHomePage() {
  return (
    <main className="pb-20">
      <JsonLdSite variant="hu" />
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
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <Image src="/libre-user.png" alt="FreeStyle Libre felhasznalo" width={1100} height={760} className="h-auto w-full rounded-xl object-cover" priority />
          </div>
        </div>
      </section>

      <section className="relative mt-12 mx-auto max-w-6xl px-6">
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
                { id: "01", title: "Gyors szallitas", detail: "2-5 nap", icon: "🚚" },
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

      <section className="mx-auto mt-14 max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#be3f6f]/25 bg-gradient-to-br from-[#fff5f8] via-white to-[#eefaf7] p-8 shadow-xl md:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#be3f6f]/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#0d9488]/10 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8f2c53]">Közösség</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[#042f2c] md:text-3xl">
              Ingyen szenzort szeretnél? Írj nekünk!
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#14534d]">
              Ha nyitott vagy rá, hogy megoszd a történetedet (például a diabéttel járó mindennapokról) a közösségi
              médiában vagy a weboldalainkon is, kiválasztott esetekben ingyen elküldhetjük neked a szenzort. Írj
              nekünk a webshop e-mail-címére, röviden mutatkozz el, és írd meg, milyen formájú együttműködés illik
              hozzád.
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#14534d]">
              Gyakorlatban sokat segít, ha tudsz készíteni egy{" "}
              <strong className="text-[#042f2c]">rövid videót</strong>, és hagyod, hogy a kommunikációnkban
              felhasználjuk (például a Facebook-oldalunkon megosztva, vagy a te beleegyezéseddel továbbközvetítve). Ha
              ez nem megoldható, egy <strong className="text-[#042f2c]">fotó</strong> is szóba jöhet, a közzétételhez
              szükséges engedéllyel. Minden jelentkezést egyenként értékelünk; a választ és az esetleges részleteket
              levelezve egyeztetjük.
            </p>
            <a
              href="mailto:info@szenzorvasarlas.hu?subject=Ingyen%20szenzor%20-%20t%C3%B6rt%C3%A9netem"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6f2147] to-[#be3f6f] px-6 py-3.5 text-base font-semibold text-white shadow-lg no-underline transition hover:brightness-110"
            >
              Írj nekünk: info@szenzorvasarlas.hu
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
