import Link from "next/link";
import { euAboutUsContent, type EuLocale } from "@/lib/eu-market-content";
import { euPaths } from "@/lib/eu-locale-paths";

export function EuAboutUsPage({ locale }: { locale: EuLocale }) {
  const c = euAboutUsContent[locale];
  const paths = euPaths(locale);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link href={paths.home} className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        {c.backLabel}
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-[#042f2c]">{c.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">{c.para1}</p>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">{c.para2}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {c.trustCards.map((item) => (
          <div key={item.title} className="rounded-2xl border border-[#de6a44]/30 bg-gradient-to-br from-[#fff4ec] to-white p-5 shadow-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f8d9c4] text-lg">
              {item.icon}
            </span>
            <h3 className="mt-3 font-semibold text-[#042f2c]">{item.title}</h3>
            <p className="mt-2 text-sm text-[#14534d]">{item.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-[#4d6864]">{c.operatorLabel}</p>
      <p className="mt-4 text-lg font-medium text-[#042f2c]">{c.closingText}</p>
    </main>
  );
}
