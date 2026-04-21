import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { GoogleAnalytics } from "@/components/google-analytics";
import { HeaderContactInline } from "@/components/header-contact-inline";
import { HeaderNav } from "@/components/header-nav";
import { SiteContactBar } from "@/components/site-contact-bar";
import { SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "@/lib/seo-config";
import { getMetadataBase, getPublicSiteUrl } from "@/lib/site-url";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700"] });

const siteUrl = getPublicSiteUrl();
const ogImageUrl = `${siteUrl}${SEO_DEFAULT_OG_IMAGE_PATH}`;

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO_DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SEO_DEFAULT_DESCRIPTION,
    images: [
      {
        url: SEO_DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — FreeStyle Libre 2 Plus`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SEO_DEFAULT_DESCRIPTION,
    images: [ogImageUrl],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#be3f6f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-8BSHQKLV03";
  const siteVariant = headers().get("x-site-variant") || "ro";
  const isHu = siteVariant === "hu";

  return (
    <html lang={isHu ? "hu" : "ro"}>
      <body className={inter.className}>
        <GoogleAnalytics measurementId={gaId} />
        {!isHu ? (
          <header className="border-b border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white shadow-md">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
              <Link
                href="/"
                className={`inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white no-underline hover:text-[#ffe2c8] ${plusJakarta.className}`}
              >
                <Image src="/brand-logo.png" alt="Logo Senzori Libre Romania" width={34} height={34} className="h-[34px] w-[34px] rounded-full bg-white/90 p-0.5" />
                <span>Senzori Libre Romania</span>
              </Link>
              <HeaderNav className={plusJakarta.className} />
              <HeaderContactInline />
            </div>
          </header>
        ) : null}
        {children}
        {!isHu ? (
          <>
            <Link
              href="/admin"
              className={`fixed bottom-2 right-2 z-40 rounded-full border border-white/25 bg-[#4d1d35]/70 px-3 py-1.5 text-xs font-semibold text-white no-underline shadow-lg backdrop-blur hover:bg-[#4d1d35] ${plusJakarta.className}`}
            >
              Admin
            </Link>
            <footer className="mt-16 border-t border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white">
              <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#ffe7d6]">
                <div className="mb-5 inline-flex items-center gap-2 text-base font-semibold text-white">
                  <Image src="/brand-logo.png" alt="Logo Senzori Libre Romania" width={28} height={28} className="h-7 w-7 rounded-full bg-white/90 p-0.5" />
                  <span>Senzori Libre Romania</span>
                </div>
                <p className="font-medium text-white">Operator magazin: Česká maloobchodní s.r.o.</p>
                <p>Adresa: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
                <p>ID: 23504463</p>
                <div className={`mt-4 flex flex-wrap items-center gap-3 text-sm ${plusJakarta.className}`}>
                  <Link
                    href="/termeni-si-conditii"
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20 hover:text-white"
                  >
                    Termeni si conditii
                  </Link>
                  <Link
                    href="/gdpr"
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20 hover:text-white"
                  >
                    GDPR
                  </Link>
                </div>
                <SiteContactBar />
              </div>
            </footer>
          </>
        ) : null}
      </body>
    </html>
  );
}
