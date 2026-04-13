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
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold text-emerald-700">
              Senzori Libre Romania
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/despre-libre">Despre Libre 2 Plus</Link>
              <Link href="/despre-noi">Despre noi</Link>
              <Link href="/termeni-si-conditii">Termeni</Link>
              <Link href="/gdpr">GDPR</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-600">
            <p>Operator magazin: Česká maloobchodní s.r.o.</p>
            <p>Adresa: Braunerova 563/7, Libeň (Praha 8), 180 00 Praha</p>
            <p>ID: 23504463</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
