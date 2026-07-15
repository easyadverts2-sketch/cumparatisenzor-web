"use client";

import Image from "next/image";
import Link from "next/link";
import { useEuLocale } from "@/lib/eu-locale-client";
import { euPaths } from "@/lib/eu-locale-paths";
import { HeaderNavEu } from "@/components/header-nav-eu";
import { EuLanguageSwitch } from "@/components/eu-language-switch";

export function EuHeader() {
  const locale = useEuLocale();
  const paths = euPaths(locale);

  return (
    <header className="border-b border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <Link href={paths.home} className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white no-underline">
          <Image src="/brand-logo.png" alt="kupitsensor.eu" width={34} height={34} className="h-[34px] w-[34px] rounded-full bg-white/90 p-0.5" />
          <span>kupitsensor.eu</span>
        </Link>
        <HeaderNavEu />
        <div className="flex items-center gap-3">
          <EuLanguageSwitch />
          <div className="hidden flex-col items-end gap-1 border-l border-white/30 pl-4 text-xs lg:flex">
            <a href="mailto:info@kupitsensor.eu" className="font-semibold text-white no-underline">
              info@kupitsensor.eu
            </a>
            <a href="https://wa.me/420777577352" target="_blank" rel="noopener noreferrer" className="font-semibold text-white no-underline">
              +420 777 577 352
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
