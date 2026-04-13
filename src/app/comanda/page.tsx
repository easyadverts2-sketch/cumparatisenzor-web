import type { Metadata } from "next";
import { OrderForm } from "@/components/order-form";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Comanda online",
  description:
    "Comanda senzor FreeStyle Libre 2 Plus: pret 350 RON, livrare in Romania, plata ramburs, transfer sau card.",
  alternates: { canonical: "/comanda" },
  openGraph: {
    url: `${getPublicSiteUrl()}/comanda`,
    title: `Comanda FreeStyle Libre 2 Plus | ${SITE_NAME}`,
    description: "Formular comanda — pret, livrare, metode de plata.",
  },
};

export default function ComandaPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/" className="text-sm font-medium text-[#0f766e] hover:underline">
        ← Inapoi la pagina principala
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Comanda FreeStyle Libre 2 Plus</h1>
      <p className="mt-2 max-w-2xl text-[#1a4d47]">
        Pret: <strong className="text-[#0a2624]">350 RON</strong> / pachet · SKU{" "}
        <strong className="text-[#0a2624]">5021791006694</strong> · Livrare{" "}
        <strong className="text-[#0a2624]">10 RON</strong>, gratuita de la 4 bucati.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border-2 border-[#0d4f4a]/10 bg-white p-4 shadow-sm">
          <Image
            src="/libre-product.png"
            alt="FreeStyle Libre 2 Plus"
            width={900}
            height={680}
            className="h-auto w-full rounded-xl object-cover"
          />
        </div>
        <OrderForm />
      </div>
    </main>
  );
}
