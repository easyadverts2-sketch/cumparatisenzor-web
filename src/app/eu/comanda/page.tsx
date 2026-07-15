import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OrderFormEu } from "@/components/order-form-eu";
import { getStorePricingForCheckout } from "@/lib/store";

export const metadata: Metadata = {
  title: "Заказать Libre 2 Plus — доставка DE, PL, AT",
  description:
    "Оформить заказ FreeStyle Libre 2 Plus (замена Libre 2) с доставкой в Германию, Польшу и Австрию. Цены в EUR.",
  alternates: {
    canonical: "/comanda",
    languages: {
      ru: "https://kupitsensor.eu/comanda",
      uk: "https://kupitsensor.eu/ua/comanda",
    },
  },
};

export default async function EuComandaPage() {
  const pricing = await getStorePricingForCheckout("EU");

  return (
    <main className="relative isolate mx-auto max-w-6xl px-6 py-12">
      <div className="relative z-10">
        <Link href="/eu" className="text-sm font-medium text-[#0f766e] hover:underline">
          ← На главную
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Заказ FreeStyle Libre 2 Plus</h1>
        <p className="mt-2 max-w-2xl text-[#1a4d47]">
          Цена: <strong className="text-[#0a2624]">{pricing.unitPrice} €</strong> / упаковка · PPL/DPD{" "}
          <strong className="text-[#0a2624]">{pricing.standardShipping} €</strong> (бесплатно от 5 шт.) · Fineship{" "}
          <strong className="text-[#0a2624]">{pricing.fineshipShipping} €</strong> (от 6 шт.).
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="rounded-2xl border-2 border-[#0d4f4a]/10 bg-white p-4 shadow-sm lg:col-span-5">
            <Image src="/libre-product.png" alt="FreeStyle Libre 2 Plus" width={900} height={680} className="h-auto w-full rounded-xl object-cover" />
          </div>
          <div className="rounded-2xl border border-[#de6a44]/25 bg-[#fff4ec] p-5 lg:col-span-7">
            <h2 className="text-lg font-semibold text-[#3a1d2d]">Быстро и безопасно</h2>
            <ul className="mt-3 grid gap-2 text-sm text-[#5c3046] sm:grid-cols-2">
              <li>✓ Подтверждение на e-mail</li>
              <li>✓ Наложенный платёж или перевод</li>
              <li>✓ PPL, DPD, Fineship</li>
              <li>✓ Доставка в DE, PL, AT</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <OrderFormEu
            unitPrice={pricing.unitPrice}
            standardShipping={pricing.standardShipping}
            fineshipShipping={pricing.fineshipShipping}
          />
        </div>
      </div>
    </main>
  );
}
