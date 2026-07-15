"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Russian and Ukrainian pages use different slugs (their content differs, not
// just the language), so switching languages mid-page needs an explicit map
// rather than just toggling a /ua prefix. Checkout/payment sub-paths aren't
// listed on purpose: an in-progress order is tied to the language it was
// started in, so switching there falls back to that language's home page.
const RU_TO_UA: Record<string, string> = {
  "/eu": "/eu/ua",
  "/eu/pro-datchik": "/eu/ua/pro-sensor",
  "/eu/o-nas": "/eu/ua/pro-nas",
  "/eu/prilozheniya": "/eu/ua/dodatky",
  "/eu/kontakt": "/eu/ua/kontakt",
  "/eu/usloviya": "/eu/ua/umovy",
  "/eu/konfidencialnost": "/eu/ua/konfidentsiynist",
};
const UA_TO_RU: Record<string, string> = Object.fromEntries(
  Object.entries(RU_TO_UA).map(([ru, ua]) => [ua, ru])
);

export function EuLanguageSwitch({ locale }: { locale: "ru" | "uk" }) {
  const pathname = usePathname() || "/eu";
  const otherHref = locale === "ru" ? RU_TO_UA[pathname] || "/eu/ua" : UA_TO_RU[pathname] || "/eu";
  const currentHref = pathname;

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-white/25 bg-white/10 p-0.5 text-xs font-bold"
      role="group"
      aria-label="RU / UA"
    >
      <Link
        href={locale === "ru" ? currentHref : otherHref}
        aria-current={locale === "ru" ? "page" : undefined}
        className={`rounded-full px-2.5 py-1 no-underline transition ${
          locale === "ru" ? "bg-white text-[#6d1c3f]" : "text-white/85 hover:text-white"
        }`}
      >
        RU
      </Link>
      <Link
        href={locale === "uk" ? currentHref : otherHref}
        aria-current={locale === "uk" ? "page" : undefined}
        className={`rounded-full px-2.5 py-1 no-underline transition ${
          locale === "uk" ? "bg-white text-[#6d1c3f]" : "text-white/85 hover:text-white"
        }`}
      >
        UA
      </Link>
    </div>
  );
}
