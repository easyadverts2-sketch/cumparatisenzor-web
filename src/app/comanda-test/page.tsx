import type { Metadata } from "next";
import Link from "next/link";
import { TestCardOrderForm } from "@/components/test-card-order-form";

export const metadata: Metadata = {
  title: "Produs test card | Sensor Sale",
  description: "Comanda de test cu plata exclusiv card (Stripe).",
};

export default function TestOrderRoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <TestCardOrderForm market="RO" />
      <div className="mt-5">
        <Link href="/" className="text-sm text-[color:var(--brand-700)] underline underline-offset-2">
          Inapoi la pagina principala
        </Link>
      </div>
    </main>
  );
}
