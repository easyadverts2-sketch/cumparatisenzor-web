import type { Metadata } from "next";
import Link from "next/link";
import { EuReviewForm } from "@/components/eu-review-form";

export const metadata: Metadata = {
  title: { absolute: "Отзывы о Libre 2 Plus | kupitsensor.eu" },
  description:
    "Оставьте отзыв о FreeStyle Libre 2 Plus и доставке в Германию, Польшу или Австрию. Публикуем только проверенные отзывы.",
  alternates: {
    canonical: "/otzyvy",
    languages: {
      ru: "https://www.kupitsensor.eu/otzyvy",
      uk: "https://www.kupitsensor.eu/ua/vidhuky",
    },
  },
};

export default function EuReviewsRuPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/eu" className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        ← На главную
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-[#042f2c]">Отзывы</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
        Поделитесь опытом с Libre 2 Plus и доставкой kupitsensor.eu. Отзывы сначала проверяем — на сайте
        публикуем только настоящие.
      </p>
      <div className="mt-8">
        <EuReviewForm locale="ru" />
      </div>
    </main>
  );
}
