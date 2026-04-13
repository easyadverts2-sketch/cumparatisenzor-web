import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { GoogleAnalytics } from "@/components/google-analytics";
import { HeaderContactInline } from "@/components/header-contact-inline";
import { SiteContactBar } from "@/components/site-contact-bar";
import { SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "@/lib/seo-config";
import { getMetadataBase, getPublicSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"] });

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
  themeColor: "#042f2c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="ro">
      <body className={inter.className}>
        <GoogleAnalytics measurementId={gaId} />
        <header className="border-b-2 border-[#0d9488]/20 bg-[#042f2c] text-white shadow-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-white no-underline hover:text-[#a7f3d0]">
              Senzori Libre Romania
            </Link>
            <nav className="flex flex-1 flex-wrap gap-x-5 gap-y-2 text-sm font-medium lg:justify-center">
              <Link href="/despre-libre" className="text-white/95 no-underline hover:text-[#a7f3d0]">
                Despre Libre 2 Plus
              </Link>
              <Link href="/despre-noi" className="text-white/95 no-underline hover:text-[#a7f3d0]">
                Despre noi
              </Link>
              <Link href="/comanda" className="text-white/95 no-underline hover:text-[#a7f3d0]">
                Comanda
              </Link>
              <Link href="/termeni-si-conditii" className="text-white/95 no-underline hover:text-[#a7f3d0]">
                Termeni
              </Link>
              <Link href="/gdpr" className="text-white/95 no-underline hover:text-[#a7f3d0]">
                GDPR
              </Link>
              <Link href="/admin" className="text-white/95 no-underline hover:text-[#a7f3d0]">
                Admin
              </Link>
            </nav>
            <HeaderContactInline />
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t-2 border-[#0d9488]/20 bg-[#042f2c] text-white">
          <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#d1fae5]">
            <p className="font-medium text-white">Operator magazin: Česká maloobchodní s.r.o.</p>
            <p>Adresa: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
            <p>ID: 23504463</p>
            <SiteContactBar />
          </div>
        </footer>
      </body>
    </html>
  );
}
