import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакти",
  alternates: {
    canonical: "/ua/kontakt",
    languages: {
      uk: "https://www.kupitsensor.eu/ua/kontakt",
      ru: "https://www.kupitsensor.eu/kontakt",
    },
  },
};

export default function EuKontaktUaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/eu/ua" className="text-sm font-medium text-[#0f766e] hover:underline">
        ← На головну
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Контакти</h1>
      <div className="mt-8 space-y-4 rounded-2xl border border-[#de6a44]/25 bg-white p-6 text-[#1a4d47]">
        <p>
          <strong>E-mail:</strong>{" "}
          <a href="mailto:info@kupitsensor.eu" className="text-[#0f766e] underline">
            info@kupitsensor.eu
          </a>
        </p>
        <p>
          <strong>Телефон / WhatsApp:</strong>{" "}
          <a href="tel:+420777577352" className="text-[#0f766e] underline">
            +420 777 577 352
          </a>
        </p>
        <p className="pt-2 text-sm">
          Оператор: Česká maloobchodní s.r.o., Braunerova 563/7, Praha 8, 180 00 Praha, ID 23504463
        </p>
      </div>
    </main>
  );
}
