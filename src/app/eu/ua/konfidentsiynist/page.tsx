import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Конфіденційність",
  alternates: {
    canonical: "/ua/konfidentsiynist",
    languages: {
      uk: "https://www.kupitsensor.eu/ua/konfidentsiynist",
      ru: "https://www.kupitsensor.eu/konfidencialnost",
    },
  },
};

export default function EuPrivacyUaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/eu/ua" className="text-sm font-medium text-[#0f766e] hover:underline">
        ← На головну
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Політика конфіденційності</h1>
      <div className="mt-6 space-y-4 text-[#1a4d47]">
        <p>
          Ми обробляємо персональні дані (ім&apos;я, адресу, e-mail, телефон) лише для виконання замовлення та
          зв&apos;язку з вами. Дані не передаються третім особам, крім служб доставки та платіжних провайдерів,
          необхідних для виконання замовлення.
        </p>
        <p>
          Контролер даних: Česká maloobchodní s.r.o. Запити щодо даних:{" "}
          <a href="mailto:info@kupitsensor.eu" className="text-[#0f766e] underline">
            info@kupitsensor.eu
          </a>
          .
        </p>
      </div>
    </main>
  );
}
