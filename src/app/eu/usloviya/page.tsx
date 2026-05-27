import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Условия использования",
  alternates: { canonical: "/eu/usloviya" },
};

export default function EuTermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-slate">
      <Link href="/eu" className="text-sm font-medium text-[#0f766e] no-underline hover:underline">
        ← На главную
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Условия использования</h1>
      <p className="text-[#1a4d47]">
        Покупая на sensorglukoz.eu, вы соглашаетесь с условиями доставки и возврата, указанными при оформлении
        заказа. Товар — медицинское изделие FreeStyle Libre 2 Plus. Оператор магазина: Česká maloobchodní s.r.o.
      </p>
      <p className="text-[#1a4d47]">
        По вопросам заказа пишите на{" "}
        <a href="mailto:info@sensorglukoz.eu">info@sensorglukoz.eu</a> или звоните +420 777 577 352.
      </p>
    </main>
  );
}
