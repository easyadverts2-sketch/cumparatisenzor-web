import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Умови використання",
  alternates: {
    canonical: "/ua/umovy",
    languages: {
      uk: "https://kupitsensor.eu/ua/umovy",
      ru: "https://kupitsensor.eu/usloviya",
    },
  },
};

export default function EuTermsUaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-slate">
      <Link href="/eu/ua" className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        ← На головну
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Умови використання</h1>
      <p className="text-[#1a4d47]">
        Купуючи на kupitsensor.eu, ви погоджуєтеся з умовами доставки та повернення, зазначеними під час
        оформлення замовлення. Товар — медичний виріб FreeStyle Libre 2 Plus. Оператор магазину: Česká
        maloobchodní s.r.o.
      </p>
      <p className="text-[#1a4d47]">
        З питань замовлення пишіть на <a href="mailto:info@kupitsensor.eu">info@kupitsensor.eu</a> або
        телефонуйте +420 777 577 352.
      </p>
    </main>
  );
}
