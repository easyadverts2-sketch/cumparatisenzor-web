import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Конфиденциальность",
  alternates: { canonical: "/konfidencialnost" },
};

export default function EuPrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/eu" className="text-sm font-medium text-[#0f766e] hover:underline">
        ← На главную
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Политика конфиденциальности</h1>
      <div className="mt-6 space-y-4 text-[#1a4d47]">
        <p>
          Мы обрабатываем персональные данные (имя, адрес, e-mail, телефон) только для выполнения заказа и связи с
          вами. Данные не передаются третьим лицам, кроме служб доставки и платёжных провайдеров, необходимых для
          исполнения заказа.
        </p>
        <p>
          Контролёр данных: Česká maloobchodní s.r.o. Запросы по данным:{" "}
          <a href="mailto:info@kupitsensor.eu" className="text-[#0f766e] underline">
            info@kupitsensor.eu
          </a>
          .
        </p>
      </div>
    </main>
  );
}
