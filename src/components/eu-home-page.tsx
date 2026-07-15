import Image from "next/image";
import Link from "next/link";
import { JsonLdSite } from "@/components/json-ld-site";
import { euHomeContent, type EuLocale } from "@/lib/eu-market-content";
import { euPaths } from "@/lib/eu-locale-paths";

export function EuHomePage({ locale }: { locale: EuLocale }) {
  const c = euHomeContent[locale];
  const paths = euPaths(locale);
  const contactEmail = "info@kupitsensor.eu";

  return (
    <main className="pb-20">
      <JsonLdSite variant="eu" />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6f2147] via-[#b23962] to-[#ee7a32] text-white">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              {c.heroBadge}
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">{c.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">{c.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={paths.order}
                className="rounded-xl bg-white px-6 py-3.5 font-semibold text-[#8f2c53] shadow-lg no-underline hover:bg-[#fff1e6]"
              >
                {c.ctaOrder}
              </Link>
              <Link
                href={paths.aboutSensor}
                className="rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3.5 font-semibold text-white no-underline backdrop-blur hover:bg-white/20"
              >
                {c.ctaLearnMore}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <Image
              src="/libre-user.png"
              alt="FreeStyle Libre 2 Plus"
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
          <h2 className="text-2xl font-bold text-[#042f2c] md:text-3xl">{c.whatIsTitle}</h2>
          {c.whatIsParas.map((p) => (
            <p key={p.slice(0, 24)} className="mt-4 text-lg leading-relaxed text-[#14534d]">
              {p}
            </p>
          ))}

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {c.featureCards.map((item) => (
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
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#ffd8be]">{c.whyUsEyebrow}</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{c.whyUsTitle}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/90 md:text-lg">{c.whyUsSubtitle}</p>
              <Link
                href={paths.order}
                className="mt-7 inline-flex rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#8f2c53] no-underline shadow-lg transition hover:bg-[#fff1e6]"
              >
                {c.ctaOrder}
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {c.whyUsCards.map((item, idx) => (
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
          <h2 className="text-2xl font-bold text-[#042f2c]">{c.careTeaserTitle}</h2>
          <p className="mt-4 text-lg text-[#14534d]">{c.careTeaserText}</p>
          <Link href={paths.aboutSensor} className="mt-5 inline-flex font-semibold text-[#be3f6f] underline">
            {c.careTeaserCta} →
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-6">
        <div className="rounded-3xl border-2 border-[#0d4f4a]/10 bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c]">{c.supportTitle}</h2>
          <p className="mt-4 text-lg text-[#14534d]">{c.supportText}</p>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#be3f6f]/25 bg-gradient-to-br from-[#fff5f8] via-white to-[#eefaf7] p-8 shadow-xl md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#be3f6f]/10 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#0d9488]/10 blur-2xl" aria-hidden />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8f2c53]">{c.communityEyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[#042f2c] md:text-3xl">{c.communityTitle}</h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#14534d]">{c.communityText1}</p>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#14534d]">{c.communityText2}</p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6f2147] to-[#be3f6f] px-6 py-3.5 text-base font-semibold text-white shadow-lg no-underline transition hover:brightness-110"
            >
              {c.communityCta}: {contactEmail}
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
