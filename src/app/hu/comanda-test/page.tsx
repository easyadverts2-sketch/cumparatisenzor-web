import type { Metadata } from "next";
import Link from "next/link";
import { TestCardOrderForm } from "@/components/test-card-order-form";

export const metadata: Metadata = {
  title: "Kartya teszt termek | Sensor Sale",
  description: "Teszt rendeles kizarolag kartyas fizetessel (Stripe).",
};

export default function TestOrderHuPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <TestCardOrderForm market="HU" />
      <div className="mt-5">
        <Link href="/hu" className="text-sm text-[color:var(--brand-700)] underline underline-offset-2">
          Vissza a fooldalra
        </Link>
      </div>
    </main>
  );
}
