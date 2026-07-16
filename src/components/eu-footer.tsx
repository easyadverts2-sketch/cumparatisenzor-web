"use client";

import Link from "next/link";
import { useEuLocale } from "@/lib/eu-locale-client";
import { euPaths } from "@/lib/eu-locale-paths";

export function EuFooter() {
  const locale = useEuLocale();
  const paths = euPaths(locale);
  const isUa = locale === "uk";

  const t = isUa
    ? {
        terms: "Умови",
        privacy: "Конфіденційність",
        contact: "Контакти",
        reviews: "Відгуки",
        operator: "Оператор",
        address: "Адреса",
      }
    : {
        terms: "Условия",
        privacy: "Конфиденциальность",
        contact: "Контакты",
        reviews: "Отзывы",
        operator: "Оператор",
        address: "Адрес",
      };

  return (
    <footer className="mt-16 border-t border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#ffe7d6]">
        <p className="font-medium text-white">{t.operator}: Česká maloobchodní s.r.o.</p>
        <p>{t.address}: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
        <p>ID: 23504463</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={paths.terms} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
            {t.terms}
          </Link>
          <Link href={paths.privacy} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
            {t.privacy}
          </Link>
          <Link href={paths.contact} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
            {t.contact}
          </Link>
          <Link href={paths.reviews} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
            {t.reviews}
          </Link>
        </div>
      </div>
    </footer>
  );
}
