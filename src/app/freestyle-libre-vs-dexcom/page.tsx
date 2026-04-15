import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Freestyle Libre vs Dexcom - comparație practică",
  description:
    "Comparație practică între Freestyle Libre și Dexcom: diferențe de utilizare, autonomie, alerte și experiențe reale din comunități.",
  alternates: { canonical: "/freestyle-libre-vs-dexcom" },
  openGraph: {
    url: `${getPublicSiteUrl()}/freestyle-libre-vs-dexcom`,
    title: `Freestyle Libre vs Dexcom | ${SITE_NAME}`,
    description:
      "Observații reale din comunități CGM și o comparație clară pentru utilizarea de zi cu zi.",
  },
};

function CompareCard({
  title,
  libre,
  dexcom,
}: {
  title: string;
  libre: string;
  dexcom: string;
}) {
  return (
    <article className="rounded-2xl border border-[#de6a44]/25 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#3a1d2d]">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="rounded-lg bg-[#fff4ec] px-3 py-2">
          <dt className="font-medium text-[#7a3f54]">Freestyle Libre 2 / 2 Plus</dt>
          <dd className="mt-0.5 text-[#5c3046]">{libre}</dd>
        </div>
        <div className="rounded-lg bg-[#f8fbfb] px-3 py-2">
          <dt className="font-medium text-[#155e57]">Dexcom</dt>
          <dd className="mt-0.5 text-[#255953]">{dexcom}</dd>
        </div>
      </dl>
    </article>
  );
}

function QuoteCard({
  source,
  descriptor,
  quote,
  tone = "forum",
}: {
  source: string;
  descriptor: string;
  quote: string;
  tone?: "forum" | "community" | "social";
}) {
  const toneClass =
    tone === "social"
      ? "border-[#be3f6f]/30 bg-[#fff4ec]"
      : tone === "community"
        ? "border-[#de6a44]/30 bg-white"
        : "border-[#c9d7d6] bg-[#f8fbfb]";

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <header className="mb-3 flex items-center justify-between gap-2 border-b border-black/10 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#7a3f54]">{source}</span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-[#5c3046]">
          {descriptor}
        </span>
      </header>
      <p className="text-sm leading-relaxed text-[#3a1d2d]">&ldquo;{quote}&rdquo;</p>
    </article>
  );
}

export default function LibreVsDexcomPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-3xl border border-[#de6a44]/30 bg-gradient-to-br from-[#fff4ec] to-white p-7 shadow-sm">
        <h1 className="text-3xl font-bold text-[#3a1d2d] md:text-4xl">Freestyle Libre sau Dexcom?</h1>
        <p className="mt-3 text-lg text-[#5c3046]">
          Am adunat diferențe practice și observații reale din comunitățile utilizatorilor CGM.
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[#6b3b4d]">
          Ambele soluții au avantaje reale. În utilizarea de zi cu zi, majoritatea utilizatorilor se uită la
          simplitate, durată a senzorului, confort și la cât de ușor este de menținut rutina zilnică.
        </p>
        <Link
          href="/comanda"
          className="mt-5 inline-flex rounded-xl bg-[#be3f6f] px-6 py-3 font-semibold text-white no-underline shadow-sm hover:bg-[#9d2f56]"
        >
          Vezi Libre 2 Plus
        </Link>
      </section>

      <section className="mt-7">
        <h2 className="text-2xl font-bold text-[#3a1d2d]">Comparație practică</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CompareCard
            title="Durată senzor"
            libre="Până la 15 zile, ceea ce înseamnă mai puține schimbări într-o lună."
            dexcom="De regulă aproximativ 10 zile, cu ritm mai frecvent de schimbare."
          />
          <CompareCard
            title="Utilizare zilnică"
            libre="Interfață clară și flux simplu pentru utilizatorul obișnuit."
            dexcom="Setări mai avansate, util pentru cei care vor control fin."
          />
          <CompareCard
            title="Alerte"
            libre="Alerte utile pentru hipo/hiper și monitorizare constantă."
            dexcom="Alerte avansate și opțiuni suplimentare de personalizare."
          />
          <CompareCard
            title="Autonomie și ritm de schimbare"
            libre="Autonomie mai lungă, mai puțină logistică în viața de zi cu zi."
            dexcom="Schimbări mai dese, dar preferat uneori de utilizatori tehnici."
          />
          <CompareCard
            title="Potrivire profil utilizator"
            libre="Foarte potrivit pentru rutină zilnică echilibrată și ușurință."
            dexcom="Potrivit pentru cei care caută mai multe funcții avansate."
          />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-2xl font-bold text-[#3a1d2d]">Ce spun utilizatorii</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuoteCard
            source="diabetes.co.uk forum"
            descriptor="experiență utilizator"
            quote="Folosesc sistemul Freestyle Libre de mai mult timp și pentru mine funcționează foarte bine."
            tone="forum"
          />
          <QuoteCard
            source="observații din comunități CGM"
            descriptor="experiențe reale"
            quote="Durata mai lungă a senzorului este unul dintre cele mai apreciate avantaje în utilizarea de zi cu zi."
            tone="community"
          />
          <QuoteCard
            source="experiențe reale"
            descriptor="discuție din comunitate"
            quote="Pentru mulți utilizatori, Libre este suficient de simplu, clar și confortabil pentru utilizarea zilnică."
            tone="community"
          />
          <QuoteCard
            source="discuții utilizatori CGM"
            descriptor="observație practică"
            quote="Alertele și monitorizarea constantă au schimbat modul în care mulți utilizatori își gestionează glicemia."
            tone="forum"
          />
          <QuoteCard
            source="forum utilizatori"
            descriptor="perspectivă echilibrată"
            quote="Unii utilizatori preferă Dexcom pentru alerte mai avansate sau pentru ecosistemul cu care sunt deja obișnuiți."
            tone="forum"
          />
          <QuoteCard
            source="comunitate CGM"
            descriptor="experiențe reale"
            quote="Pentru utilizarea obișnuită, mulți utilizatori caută în primul rând confort, autonomie și claritate."
            tone="social"
          />
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-[#be3f6f]/30 bg-gradient-to-br from-[#fff0f5] to-[#fff4ec] p-6 shadow-sm">
        <header className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#be3f6f] text-sm text-white">
            •
          </span>
          <span className="text-sm font-semibold uppercase tracking-wide text-[#7a3f54]">
            postare din comunitate Facebook
          </span>
        </header>
        <blockquote className="text-xl font-semibold leading-relaxed text-[#3a1d2d] md:text-2xl">
          &ldquo;Atât FreeStyle Libre, cât și Dexcom sunt soluții eficiente. Alegerea potrivită depinde de preț,
          durata de utilizare, aplicație și suport.&rdquo;
        </blockquote>
        <p className="mt-3 text-sm text-[#6b3b4d]">observație din comunitatea utilizatorilor CGM</p>
      </section>

      <section className="mt-7 rounded-2xl border border-[#d2d2d2] bg-[#f9fafb] p-5">
        <h2 className="text-lg font-semibold text-[#3a1d2d]">Unde Dexcom poate avea avantaj</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#d8d8d8] bg-white p-4 text-sm text-[#4b5563]">
            Dexcom poate fi preferat de utilizatorii care vor alerte mai avansate și control mai detaliat.
          </div>
          <div className="rounded-xl border border-[#d8d8d8] bg-white p-4 text-sm text-[#4b5563]">
            Unii utilizatori rămân la Dexcom pentru că sunt deja obișnuiți cu ecosistemul lui.
          </div>
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-[#de6a44]/25 bg-white p-6">
        <h2 className="text-xl font-bold text-[#3a1d2d]">Ce contează cel mai mult în practică</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[#5c3046] md:grid-cols-2">
          <li className="rounded-lg bg-[#fff4ec] px-3 py-2">• simplitatea contează</li>
          <li className="rounded-lg bg-[#fff4ec] px-3 py-2">• durata senzorului contează</li>
          <li className="rounded-lg bg-[#fff4ec] px-3 py-2">• confortul în utilizarea de zi cu zi contează</li>
          <li className="rounded-lg bg-[#fff4ec] px-3 py-2">
            • pentru mulți utilizatori, Libre rămâne o alegere practică și echilibrată
          </li>
        </ul>
      </section>

      <section className="mt-7 rounded-3xl border border-[#de6a44]/30 bg-gradient-to-br from-[#fff4ec] to-white p-7 shadow-sm">
        <h2 className="text-2xl font-bold text-[#3a1d2d]">Pentru mulți utilizatori, Libre rămâne alegerea practică</h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[#6b3b4d]">
          Dacă aveți nevoie de o soluție pentru viața de zi cu zi, cu autonomie bună a senzorului, utilizare clară
          și experiență confortabilă, Libre 2 Plus este o opțiune foarte solidă.
        </p>
        <Link
          href="/comanda"
          className="mt-5 inline-flex rounded-xl bg-[#be3f6f] px-6 py-3 font-semibold text-white no-underline shadow-sm hover:bg-[#9d2f56]"
        >
          Vezi disponibilitatea Libre 2 Plus
        </Link>
      </section>
    </main>
  );
}
