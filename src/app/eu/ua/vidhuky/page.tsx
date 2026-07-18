import type { Metadata } from "next";
import Link from "next/link";
import { EuReviewForm } from "@/components/eu-review-form";

export const metadata: Metadata = {
  title: { absolute: "Відгуки про Libre 2 Plus | kupitsensor.eu" },
  description:
    "Залиште відгук про FreeStyle Libre 2 Plus і доставку до Німеччини, Польщі чи Австрії. Публікуємо лише перевірені відгуки.",
  alternates: {
    canonical: "/ua/vidhuky",
    languages: {
      uk: "https://www.kupitsensor.eu/ua/vidhuky",
      ru: "https://www.kupitsensor.eu/otzyvy",
    },
  },
};

export default function EuReviewsUaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/eu/ua" className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        ← На головну
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-[#042f2c]">Відгуки</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
        Поділіться досвідом з Libre 2 Plus і доставкою kupitsensor.eu. Відгуки спочатку перевіряємо — на сайті
        публікуємо лише справжні.
      </p>
      <div className="mt-8">
        <EuReviewForm locale="uk" />
      </div>
    </main>
  );
}
