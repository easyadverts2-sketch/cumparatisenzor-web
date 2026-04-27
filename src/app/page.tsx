import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLdSite } from "@/components/json-ld-site";
import { SEO_DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

const homeUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — FreeStyle Libre 2 Plus · Livrare in Romania` },
  description: SEO_DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    url: homeUrl,
    title: SITE_NAME,
    description: SEO_DEFAULT_DESCRIPTION,
  },
};

export default function Home() {
  return (
    <main className="pb-20">
      <JsonLdSite />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6f2147] via-[#b23962] to-[#ee7a32] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              FreeStyle Libre 2 Plus — disponibil in Romania
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Monitorizare a glicemiei, fara intepaturi zilnice in degete
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Comanda simpla, livrare in Romania si echipa care intelege comunitatea diabetului.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/comanda"
                className="rounded-xl bg-white px-6 py-3.5 font-semibold text-[#8f2c53] shadow-lg no-underline hover:bg-[#fff1e6]"
              >
                Comanda acum
              </Link>
              <Link
                href="/despre-libre"
                className="rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3.5 font-semibold text-white no-underline backdrop-blur hover:bg-white/20"
              >
                Cum functioneaza
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <Image
              src="/libre-user.png"
              alt="Utilizator FreeStyle Libre 2 Plus"
              width={1100}
              height={760}
              className="h-auto w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="relative -mt-8 mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border-2 border-[#de6a44]/25 bg-white p-8 shadow-xl md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c] md:text-3xl">Ce este FreeStyle Libre 2 Plus?</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
            Este un sistem de monitorizare continua a glucozei (CGM): un senzor mic purtat pe brat care, pana la{" "}
            <strong className="text-[#042f2c]">15 zile</strong>, masoara glicemia si o puteti vedea pe telefon sau pe
            un cititor dedicat — fara sa va intepati in fiecare zi doar pentru o masuratoare.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
            Comunitatea care a lansat acest magazin a vrut sa aduca acest dispozitiv in Romania pentru ca stim ca
            disponibilitatea este adesea insuficienta. Il consideram un pas important — chiar revolutionar — in
            compensarea diabetului zilnic, alaturi de sfatul echipei medicale.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: "🔔",
                title: "Alarme pentru hipere si hipo",
                text: "Puteti primi alerte cand valorile sunt prea mari sau prea mici (conform setarilor).",
              },
              {
                icon: "📱",
                title: "Citire rapida",
                text: "Scanati cu telefonul compatibil sau folositi cititorul dedicat.",
              },
              {
                icon: "📈",
                title: "Tendinte in aplicatie",
                text: "Vedeti evolutia si istoricul pentru decizii mai clare in timpul zilei.",
              },
              {
                icon: "🩹",
                title: "Mai putina durere zilnica",
                text: "Fara intepaturi repetate in degete pentru fiecare masuratoare.",
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

      <section className="mx-auto mt-14 max-w-6xl px-6">
        <div className="why-split-panel relative overflow-hidden rounded-3xl border border-[#b44b67]/25 bg-gradient-to-br from-[#6f2147] via-[#9d2f56] to-[#d45a40] p-6 text-white shadow-2xl md:p-8">
          <div className="why-split-glow why-split-glow-one" />
          <div className="why-split-glow why-split-glow-two" />
          <div className="relative grid gap-6 lg:grid-cols-[1.05fr_1.35fr] lg:items-stretch">
            <div className="rounded-2xl border border-white/25 bg-black/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#ffd8be]">Argumente clare</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">De ce sa alegi cumparatisenzor.ro</h2>
              <p className="mt-4 text-base leading-relaxed text-white/90 md:text-lg">
                Livrare rapida, produse sigilate si suport clar pentru fiecare comanda, fara complicatii.
              </p>
              <Link
                href="/comanda"
                className="mt-7 inline-flex rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#8f2c53] no-underline shadow-lg transition hover:bg-[#fff1e6]"
              >
                Comanda acum
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  id: "01",
                  title: "Livrare rapida",
                  detail: "2-5 zile",
                  icon: "🚚",
                },
                {
                  id: "02",
                  title: "Senzori originali",
                  detail: "sigilati, verificati",
                  icon: "📦",
                },
                {
                  id: "03",
                  title: "Suport in limba romana",
                  detail: "raspuns rapid la intrebari",
                  icon: "🇷🇴",
                },
                {
                  id: "04",
                  title: "Plata simpla",
                  detail: "ramburs sau transfer",
                  icon: "💳",
                },
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
        <div className="rounded-3xl border-2 border-[#0d4f4a]/10 bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c]">Suport pentru clienti</h2>
          <p className="mt-4 text-lg text-[#14534d]">
            Oferim ajutor telefonic in ceha, poloneza, engleza, germana, rusa si croata. Daca vorbiti doar romana,
            va rugam sa ne scrieti mai intai pe e-mail — cautam un coleg pentru helpdesk in limba romana.
          </p>
          <p className="mt-4 text-[#14534d]">
            Materialul din pachet poate sa nu fie in limba romana; pentru utilizare, consultati sectiunea{" "}
            <Link href="/despre-libre" className="font-semibold text-[#be3f6f] underline">
              Despre Libre 2 Plus
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-6">
        <div className="rounded-3xl border border-[#b44b67]/20 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-[#14534d]">Vrei sa testezi plata cu cardul in Stripe?</p>
          <Link
            href="/comanda-test"
            className="mt-3 inline-flex rounded-xl bg-[#8f2c53] px-6 py-3 font-semibold text-white no-underline hover:bg-[#7b2749]"
          >
            Produs test (1 RON)
          </Link>
        </div>
      </section>
    </main>
  );
}
