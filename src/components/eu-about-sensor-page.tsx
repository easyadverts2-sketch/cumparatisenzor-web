import Link from "next/link";
import { euAboutSensorContent, type EuLocale } from "@/lib/eu-market-content";
import { euPaths } from "@/lib/eu-locale-paths";

export function EuAboutSensorPage({ locale }: { locale: EuLocale }) {
  const c = euAboutSensorContent[locale];
  const paths = euPaths(locale);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link href={paths.home} className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        {c.backLabel}
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-[#042f2c]">{c.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">{c.intro}</p>

      <section className="mt-10 rounded-2xl border border-[#0d4f4a]/12 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#042f2c]">{c.newTitle}</h2>
        <ul className="mt-3 space-y-2">
          {c.newBullets.map((b) => (
            <li key={b} className="flex gap-2 text-[#14534d]">
              <span aria-hidden className="mt-1 text-[#0d9488]">
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-[#4d6864]">{c.newPara}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-[#0d4f4a]/12 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#042f2c]">{c.accuracyTitle}</h2>
        <p className="mt-3 leading-relaxed text-[#14534d]">{c.accuracyPara1}</p>
        <p className="mt-3 leading-relaxed text-[#14534d]">{c.accuracyPara2}</p>
        <p className="mt-3 leading-relaxed text-[#14534d]">{c.accuracyPara3}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-[#de6a44]/25 bg-gradient-to-br from-[#fff4ec] to-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#042f2c]">{c.careTitle}</h2>
        <ul className="mt-3 space-y-2">
          {c.careBullets.map((b) => (
            <li key={b} className="flex gap-2 text-[#14534d]">
              <span aria-hidden className="mt-1 text-[#be3f6f]">
                •
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-[#0d4f4a]/12 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#042f2c]">{c.compatTitle}</h2>
        <p className="mt-3 leading-relaxed text-[#14534d]">{c.compatPara}</p>
        <Link href={paths.apps} className="mt-4 inline-flex font-semibold text-[#be3f6f] underline">
          {c.compatCta} →
        </Link>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-[#4d6864]">{c.footnote}</p>
    </main>
  );
}
