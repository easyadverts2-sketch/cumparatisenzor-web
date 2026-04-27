import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { StripeEmbeddedPayment } from "@/components/stripe-embedded-payment";

export const metadata: Metadata = {
  title: "Plata card securizata",
  robots: NOINDEX_PAGE,
};

export default function PlataCardPage({
  searchParams,
}: {
  searchParams: { orderId?: string; nr?: string; test?: string };
}) {
  const orderId = String(searchParams.orderId || "");
  const nrRaw = String(searchParams.nr || "");
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "";
  const isTest = String(searchParams.test || "") === "1";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-3xl border-2 border-[#de6a44]/30 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#3a1d2d]">{isTest ? "Platba kartou (test)" : "Plata cu cardul"}</h1>
        {nr ? <p className="mt-2 font-semibold text-[#be3f6f]">{isTest ? `Objednavka c. ${nr}` : `Comanda nr. ${nr}`}</p> : null}
        <p className="mt-4 text-sm text-[#6b3b4d]">
          {isTest
            ? "Vyplnte udaje karty v zabezpecenem Stripe formulari. Udaje o karte se na tomto webu neukladaji."
            : "Completati datele cardului in formularul securizat Stripe. Nu stocam datele cardului pe acest site."}
        </p>

        <div className="mt-6">
          {orderId ? (
            <StripeEmbeddedPayment
              orderId={orderId}
              orderNumber={nr || "—"}
              market="RO"
              uiLanguage={isTest ? "CS" : "RO"}
              backHref={isTest ? "/comanda-test" : "/comanda"}
            />
          ) : (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {isTest ? "Chybi udaje objednavky pro platbu kartou." : "Lipsesc datele comenzii pentru plata card."}
            </p>
          )}
        </div>

        <Link href={isTest ? "/comanda-test" : "/comanda"} className="mt-6 inline-block text-sm font-medium text-[#be3f6f] underline">
          {isTest ? "Zpet na test objednavku" : "Inapoi la comanda"}
        </Link>
      </div>
    </main>
  );
}
