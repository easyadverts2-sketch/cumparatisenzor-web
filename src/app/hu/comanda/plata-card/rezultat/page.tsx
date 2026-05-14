import type { Metadata } from "next";
import { NOINDEX_PAGE } from "@/lib/seo-config";
import { StripePaymentResult } from "@/components/stripe-payment-result";

export const metadata: Metadata = {
  title: "Kartyas fizetes eredmenye",
  robots: NOINDEX_PAGE,
};

export default function HuCardPaymentResultPage({
  searchParams,
}: {
  searchParams: { nr?: string; pendingId?: string };
}) {
  const pendingId = String(searchParams.pendingId || "").trim();
  const nrRaw = searchParams.nr || "";
  const nr = nrRaw ? nrRaw.padStart(7, "0") : "—";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <StripePaymentResult market="HU" orderNumber={nr} pendingId={pendingId || undefined} />
    </main>
  );
}
