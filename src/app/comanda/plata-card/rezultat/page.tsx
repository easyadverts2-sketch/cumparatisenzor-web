import type { Metadata } from "next";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { StripePaymentResult } from "@/components/stripe-payment-result";

export const metadata: Metadata = {
  title: "Rezultat plata cu cardul",
  robots: NOINDEX_PAGE,
};

export default function PlataCardRezultatPage({
  searchParams,
}: {
  searchParams: { nr?: string; session_id?: string };
}) {
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "—";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <StripePaymentResult market="RO" orderNumber={nr} />
    </main>
  );
}
