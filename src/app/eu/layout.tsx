import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Suspense } from "react";
import { EuHeader } from "@/components/eu-header";
import { EuFooter } from "@/components/eu-footer";
import { EuHtmlLangSync } from "@/components/eu-html-lang-sync";
import { MetaPixel } from "@/components/meta-pixel";
import { MetaPixelPageViews } from "@/components/meta-pixel-page-views";

export const metadata: Metadata = {
  title: {
    default: "Libre 2 Plus — kupitsensor.eu",
    template: "%s | kupitsensor.eu",
  },
  description:
    "Купить FreeStyle Libre 2 и Libre 2 Plus с доставкой в Германию, Польшу и Австрию. Русскоязычная и украиноязычная поддержка.",
  alternates: {
    canonical: "/",
    languages: {
      ru: "https://kupitsensor.eu/",
      uk: "https://kupitsensor.eu/ua",
      "x-default": "https://kupitsensor.eu/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "kupitsensor.eu",
    title: "Купить Libre 2 Plus — доставка в DE, PL, AT",
    description:
      "FreeStyle Libre 2 Plus — заказ с доставкой в Германию, Польшу и Австрию. Поддержка на русском и украинском.",
    url: "https://kupitsensor.eu",
    images: [
      {
        url: "/libre-user.png",
        width: 1200,
        height: 630,
        alt: "FreeStyle Libre 2 Plus — kupitsensor.eu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Купить Libre 2 Plus — доставка в DE, PL, AT",
    description:
      "FreeStyle Libre 2 Plus с доставкой в Германию, Польшу и Австрию. Поддержка на русском и украинском.",
    images: ["/libre-user.png"],
  },
};

export default function EuLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EuHtmlLangSync />
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
      <EuHeader />
      {children}
      <EuFooter />
    </>
  );
}
