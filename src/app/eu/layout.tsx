import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { HeaderNavEu } from "@/components/header-nav-eu";
import { MetaPixel } from "@/components/meta-pixel";
import { MetaPixelPageViews } from "@/components/meta-pixel-page-views";

export const metadata: Metadata = {
  title: {
    default: "sensorglukoz.eu",
    template: "%s | sensorglukoz.eu",
  },
  description:
    "FreeStyle Libre 2 Plus — заказ с доставкой в Германию, Польшу и Австрию. Русскоязычная поддержка.",
  alternates: { canonical: "/eu" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "sensorglukoz.eu",
    title: "sensorglukoz.eu — FreeStyle Libre 2 Plus",
    description:
      "FreeStyle Libre 2 Plus — заказ с доставкой в Германию, Польшу и Австрию.",
    url: "https://sensorglukoz.eu/eu",
    images: [
      {
        url: "/libre-user.png",
        width: 1200,
        height: 630,
        alt: "sensorglukoz.eu — FreeStyle Libre 2 Plus",
      },
    ],
  },
};

export default function EuLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        id="google-ads-tag-src-eu"
        src="https://www.googletagmanager.com/gtag/js?id=AW-18125938204"
        strategy="afterInteractive"
      />
      <Script id="google-ads-tag-init-eu" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18125938204');
        `}
      </Script>
      <MetaPixel scriptId="meta-pixel-eu" />
      <Suspense fallback={null}>
        <MetaPixelPageViews />
      </Suspense>
      <header className="border-b border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/eu" className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white no-underline">
            <Image src="/brand-logo.png" alt="sensorglukoz.eu" width={34} height={34} className="h-[34px] w-[34px] rounded-full bg-white/90 p-0.5" />
            <span>sensorglukoz.eu</span>
          </Link>
          <HeaderNavEu />
          <div className="hidden flex-col items-end gap-1 border-l border-white/30 pl-4 text-xs lg:flex">
            <a href="mailto:info@sensorglukoz.eu" className="font-semibold text-white no-underline">
              info@sensorglukoz.eu
            </a>
            <a href="https://wa.me/420777577352" target="_blank" rel="noopener noreferrer" className="font-semibold text-white no-underline">
              +420 777 577 352
            </a>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#ffe7d6]">
          <p className="font-medium text-white">Оператор: Česká maloobchodní s.r.o.</p>
          <p>Адрес: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
          <p>ID: 23504463</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/eu/usloviya" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              Условия
            </Link>
            <Link href="/eu/konfidencialnost" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              Конфиденциальность
            </Link>
            <Link href="/eu/kontakt" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              Контакты
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
