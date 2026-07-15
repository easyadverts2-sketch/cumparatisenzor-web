import Link from "next/link";
import type { EuLocale } from "@/lib/eu-market-content";
import { euPaths } from "@/lib/eu-locale-paths";
import { euCompareContent } from "@/lib/eu-seo-pages";

export function EuComparePage({ locale }: { locale: EuLocale }) {
  const c = euCompareContent[locale];
  const paths = euPaths(locale);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link href={paths.home} className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        {c.backLabel}
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-[#042f2c]">{c.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">{c.intro}</p>

      <section className="mt-10 overflow-hidden rounded-2xl border border-[#0d4f4a]/12 bg-white shadow-sm">
        <h2 className="border-b border-[#0d4f4a]/10 bg-[#f6fbfa] px-6 py-4 text-xl font-bold text-[#042f2c]">
          {c.tableTitle}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[#0d4f4a]/10 text-[#042f2c]">
                <th className="px-6 py-3 font-semibold">{locale === "uk" ? "Параметр" : "Характеристика"}</th>
                <th className="px-6 py-3 font-semibold">Libre 2</th>
                <th className="px-6 py-3 font-semibold">Libre 2 Plus</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
                <tr key={row.label} className="border-b border-[#0d4f4a]/08 last:border-0">
                  <th scope="row" className="px-6 py-3 font-medium text-[#042f2c]">
                    {row.label}
                  </th>
                  <td className="px-6 py-3 text-[#14534d]">{row.libre2}</td>
                  <td className="px-6 py-3 font-medium text-[#0f766e]">{row.libre2Plus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#0d4f4a]/12 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#042f2c]">{c.whyTitle}</h2>
        {c.whyParas.map((p) => (
          <p key={p.slice(0, 32)} className="mt-3 leading-relaxed text-[#14534d]">
            {p}
          </p>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-[#de6a44]/25 bg-gradient-to-br from-[#fff4ec] to-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#042f2c]">{c.geoTitle}</h2>
        <p className="mt-3 leading-relaxed text-[#14534d]">{c.geoPara}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={paths.order}
            className="rounded-xl bg-[#8f2c53] px-5 py-3 font-semibold text-white no-underline hover:bg-[#6d1c3f]"
          >
            {c.ctaOrder}
          </Link>
          <Link href={paths.aboutSensor} className="rounded-xl border border-[#8f2c53]/30 px-5 py-3 font-semibold text-[#8f2c53] no-underline hover:bg-white">
            {c.ctaSensor}
          </Link>
        </div>
      </section>
    </main>
  );
}
