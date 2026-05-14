import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { StripeEmbeddedPayment } from "@/components/stripe-embedded-payment";

export const metadata: Metadata = {
  title: "Bankkartyas fizetes",
  robots: NOINDEX_PAGE,
};

export default function HuCardPaymentPage({
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
        <h1 className="text-2xl font-bold text-[#3a1d2d]">Bankkartyas fizetes</h1>
        {pendingId ? (
          <p className="mt-2 text-sm text-[#6b3b4d]">
            A rendeles csak sikeres fizetes utan kerul a rendszerbe.
          </p>
        ) : nr ? (
          <p className="mt-2 font-semibold text-[#be3f6f]">{`Rendelesszam: ${nr}`}</p>
        ) : null}
        <p className="mt-4 text-sm text-[#6b3b4d]">
          Add meg a kartyaadatokat a biztonsagos Stripe feluleten. A kartyaadatokat nem taroljuk.
        </p>

        <div className="mt-6">
          {pendingId ? (
            <StripeEmbeddedPayment
              pendingId={pendingId}
              orderNumber="—"
              market="HU"
              uiLanguage="HU"
              backHref="/hu/comanda"
            />
          ) : orderId ? (
            <StripeEmbeddedPayment
              orderId={orderId}
              orderNumber={nr || "-"}
              market="HU"
              uiLanguage="HU"
              backHref="/hu/comanda"
            />
          ) : (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Hianyznak a kartyas fizeteshez szukseges adatok (ervenytelen vagy lejart munkamenet).
            </p>
          )}
        </div>

        <Link
          href="/hu/comanda"
          className="mt-6 inline-block text-sm font-medium text-[#be3f6f] underline"
        >
          Vissza a rendeleshez
        </Link>
      </div>
    </main>
  );
}
