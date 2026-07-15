import Link from "next/link";
import type { EuLocale } from "@/lib/eu-market-content";
import { euPaths } from "@/lib/eu-locale-paths";
import { euFaqContent } from "@/lib/eu-seo-pages";
import { JsonLdEuFaq } from "@/components/json-ld-eu-seo";

export function EuFaqPage({ locale }: { locale: EuLocale }) {
  const c = euFaqContent[locale];
  const paths = euPaths(locale);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <JsonLdEuFaq items={c.items} />
      <Link href={paths.home} className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        {c.backLabel}
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-[#042f2c]">{c.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">{c.intro}</p>

      <div className="mt-10 space-y-4">
        {c.items.map((item) => (
          <section
            key={item.q}
            className="rounded-2xl border border-[#0d4f4a]/12 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-[#042f2c]">{item.q}</h2>
            <p className="mt-3 leading-relaxed text-[#14534d]">{item.a}</p>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href={paths.order}
          className="inline-flex rounded-xl bg-[#8f2c53] px-6 py-3.5 font-semibold text-white no-underline hover:bg-[#6d1c3f]"
        >
          {c.ctaOrder}
        </Link>
      </div>
    </main>
  );
}
