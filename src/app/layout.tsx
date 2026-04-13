import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Senzori Libre Romania",
  description: "Magazin pentru FreeStyle Libre 2 Plus in Romania",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <header className="border-b-2 border-[#0d9488]/20 bg-[#042f2c] text-white shadow-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-white no-underline hover:text-[#a7f3d0]">
              Senzori Libre Romania
            </Link>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
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
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t-2 border-[#0d9488]/20 bg-[#042f2c] text-white">
          <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#d1fae5]">
            <p className="font-medium text-white">Operator magazin: Česká maloobchodní s.r.o.</p>
            <p>Adresa: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
            <p>ID: 23504463</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
