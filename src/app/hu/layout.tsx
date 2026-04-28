import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HeaderNavHu } from "@/components/header-nav-hu";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: {
    default: "Szenzorvasarlas.hu",
    template: "%s | Szenzorvasarlas.hu",
  },
  description:
    "FreeStyle Libre 2 Plus megrendeles Magyarorszagra. Gyors szallitas, magyar nyelvu tamogatas.",
  alternates: { canonical: "/hu" },
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "Szenzorvasarlas.hu",
    title: "Szenzorvasarlas.hu - FreeStyle Libre 2 Plus",
    description:
      "FreeStyle Libre 2 Plus megrendeles Magyarorszagra. Gyors szallitas, magyar nyelvu tamogatas.",
    url: "https://szenzorvasarlas.hu/hu",
    images: [
      {
        url: "/libre-user.png",
        width: 1200,
        height: 630,
        alt: "Szenzorvasarlas.hu - FreeStyle Libre 2 Plus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Szenzorvasarlas.hu - FreeStyle Libre 2 Plus",
    description:
      "FreeStyle Libre 2 Plus megrendeles Magyarorszagra. Gyors szallitas, magyar nyelvu tamogatas.",
    images: ["/libre-user.png"],
  },
};

export default function HuLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-[#ffb174]/30 bg-gradient-to-r from-[#6f2147] via-[#a22d53] to-[#df5b42] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/hu" className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white no-underline">
            <Image src="/brand-logo.png" alt="Szenzorvasarlas.hu logo" width={34} height={34} className="h-[34px] w-[34px] rounded-full bg-white/90 p-0.5" />
            <span>Szenzorvasarlas.hu</span>
          </Link>
          <HeaderNavHu />
          <div className="hidden flex-col items-end gap-1 border-l border-white/30 pl-4 text-xs lg:flex">
            <a href="mailto:info@szenzorvasarlas.hu" className="font-semibold text-white no-underline">
              info@szenzorvasarlas.hu
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
          <p className="font-medium text-white">Operator: Česká maloobchodní s.r.o.</p>
          <p>Cim: Braunerova 563/7, Liben (Praga 8), 180 00 Praha</p>
          <p>ID: 23504463</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/hu/aszf" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              ASZF
            </Link>
            <Link href="/hu/adatkezeles" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              Adatkezeles
            </Link>
            <Link href="/hu/kontakt" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white no-underline hover:bg-white/20">
              Lepjen kapcsolatba velunk
            </Link>
          </div>
          <div className="mt-6">
            <span className="text-xs font-medium uppercase tracking-wide text-[#ffd2af]/90">Kovess minket</span>
            <div className="mt-2">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
                aria-label="Facebook"
                title="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
