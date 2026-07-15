import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { headers } from "next/headers";
import { HeaderNavEu } from "@/components/header-nav-eu";
import { EuLanguageSwitch } from "@/components/eu-language-switch";
import { MetaPixel } from "@/components/meta-pixel";
import { MetaPixelPageViews } from "@/components/meta-pixel-page-views";

export const metadata: Metadata = {
  title: {
    default: "kupitsensor.eu",
    template: "%s | kupitsensor.eu",
  },
  description:
    "FreeStyle Libre 2 Plus — заказ с доставкой в Германию, Польшу и Австрию. Русскоязычная и украиноязычная поддержка.",
  alternates: {
    canonical: "/",
    languages: {
      ru: "https://kupitsensor.eu/",
      uk: "https://kupitsensor.eu/ua",
      "ro-RO": "https://cumparatisenzor.ro/",
      "hu-HU": "https://szenzorvasarlas.hu/",
      "x-default": "https://cumparatisenzor.ro/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "kupitsensor.eu",
    title: "kupitsensor.eu — FreeStyle Libre 2 Plus",
    description:
      "FreeStyle Libre 2 Plus — заказ с доставкой в Германию, Польшу и Австрию.",
    url: "https://kupitsensor.eu",
    images: [
      {
        url: "/libre-user.png",
        width: 1200,
        height: 630,
        alt: "kupitsensor.eu — FreeStyle Libre 2 Plus",
      },
    ],
  },
};

export default function EuLayout({ children }: { children: ReactNode }) {
  const pathname = headers().get("x-pathname") || "";
  const isUa = pathname === "/eu/ua" || pathname.startsWith("/eu/ua/");
  const locale = isUa ? "uk" : "ru";
  const homeHref = isUa ? "/eu/ua" : "/eu";
  const termsHref = isUa ? "/eu/ua/umovy" : "/eu/usloviya";
  const privacyHref = isUa ? "/eu/ua/konfidentsiynist" : "/eu/konfidencialnost";
  const contactHref = isUa ? "/eu/ua/kontakt" : "/eu/kontakt";

  const t = isUa
    ? { terms: "Умови", privacy: "Конфіденційність", contact: "Контакти", operator: "Оператор" }
    : { terms: "Условия", privacy: "Конфиденциальность", contact: "Контакты", operator: "Оператор" };

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
          <Link href={homeHref} className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white no-underline">
            <Image src="/brand-logo.png" alt="kupitsensor.eu" width={34} height={34} className="h-[34px] w-[34px] rounded-full bg-white/90 p-0.5" />
            <span>kupitsensor.eu</span>
          </Link>
          <HeaderNavEu locale={locale} />
          <div className="flex items-center gap-3">
            <EuLanguageSwitch locale={locale} />
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
      {children}
      <footer className="mt-16 border-t border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#ffe7d6]">
          <p className="font-medium text-white">{t.operator}: Česká maloobchodní s.r.o.</p>
          <p>{isUa ? "Адреса" : "Адрес"}: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
          <p>ID: 23504463</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={termsHref} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              {t.terms}
            </Link>
            <Link href={privacyHref} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              {t.privacy}
            </Link>
            <Link href={contactHref} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              {t.contact}
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
