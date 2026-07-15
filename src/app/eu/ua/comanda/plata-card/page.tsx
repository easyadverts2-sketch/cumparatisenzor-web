import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { StripeEmbeddedPayment } from "@/components/stripe-embedded-payment";

export const metadata: Metadata = {
  title: "Оплата карткою",
  robots: NOINDEX_PAGE,
};

export default function EuCardPaymentUaPage({
  searchParams,
}: {
  searchParams: { orderId?: string; nr?: string; pendingId?: string };
}) {
  const pendingId = String(searchParams.pendingId || "").trim();
  const orderId = String(searchParams.orderId || "").trim();
  const nrRaw = String(searchParams.nr || "");
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-3xl border-2 border-[#de6a44]/30 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#3a1d2d]">Оплата банківською карткою</h1>
        {pendingId ? (
          <p className="mt-2 text-sm text-[#6b3b4d]">
            Замовлення буде створено лише після успішної оплати.
          </p>
        ) : nr ? (
          <p className="mt-2 font-semibold text-[#be3f6f]">{`Номер замовлення: ${nr}`}</p>
        ) : null}
        <p className="mt-4 text-sm text-[#6b3b4d]">
          Введіть дані картки на захищеній сторінці Stripe. Ми не зберігаємо дані картки.
        </p>

        <div className="mt-6">
          {pendingId ? (
            <StripeEmbeddedPayment
              pendingId={pendingId}
              orderNumber="—"
              market="EU"
              uiLanguage="UK"
              backHref="/eu/ua/comanda"
            />
          ) : orderId ? (
            <StripeEmbeddedPayment
              orderId={orderId}
              orderNumber={nr || "-"}
              market="EU"
              uiLanguage="UK"
              backHref="/eu/ua/comanda"
            />
          ) : (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Недостатньо даних для оплати (сесія закінчилась або невірне посилання).
            </p>
          )}
        </div>

        <Link href="/eu/ua/comanda" className="mt-6 inline-block text-sm font-medium text-[#be3f6f] underline">
          Повернутися до замовлення
        </Link>
      </div>
    </main>
  );
}
