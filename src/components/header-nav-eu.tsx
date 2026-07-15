"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEuLocale } from "@/lib/eu-locale-client";

type EuNavLocale = "ru" | "uk";

const LINKS: Record<EuNavLocale, { href: string; label: string }[]> = {
  ru: [
    { href: "/eu/pro-datchik", label: "О сенсоре" },
    { href: "/eu/o-nas", label: "О нас" },
    { href: "/eu/prilozheniya", label: "Приложения" },
    { href: "/eu/comanda", label: "Заказ" },
  ],
  uk: [
    { href: "/eu/ua/pro-sensor", label: "Про сенсор" },
    { href: "/eu/ua/pro-nas", label: "Про нас" },
    { href: "/eu/ua/dodatky", label: "Додатки" },
    { href: "/eu/ua/comanda", label: "Замовити" },
  ],
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNavEu({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/eu";
  const locale = useEuLocale();
  const links = LINKS[locale];

  return (
    <nav className={`flex flex-1 flex-wrap gap-2 text-[15px] font-semibold tracking-[0.01em] lg:justify-center ${className}`}>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const baseClass =
          "rounded-full px-4 py-1.5 no-underline shadow-sm transition active:translate-y-0 active:scale-[0.98]";
        const activeClass =
          "border border-[#ffd2af]/65 bg-[#fff2e8] text-[#6d1c3f] ring-2 ring-[#ffd8be]/35";
        const inactiveClass =
          "border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:text-white";

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`${baseClass} ${active ? activeClass : inactiveClass}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
