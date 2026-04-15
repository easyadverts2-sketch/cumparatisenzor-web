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
    <main className="relative isolate mx-auto max-w-6xl px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-36 top-12 h-[560px] w-[280px] rotate-[-14deg] bg-[url('/sensor-motif.png')] bg-[length:190px_auto] bg-repeat-y opacity-[0.14]" />
        <div className="absolute -right-36 top-20 h-[620px] w-[280px] rotate-[12deg] bg-[url('/sensor-motif.png')] bg-[length:190px_auto] bg-repeat-y opacity-[0.14]" />
        <div className="absolute -left-20 bottom-0 h-[320px] w-[220px] rotate-[8deg] bg-[url('/sensor-motif.png')] bg-[length:160px_auto] bg-no-repeat opacity-[0.12]" />
        <div className="absolute -right-20 bottom-0 h-[320px] w-[220px] rotate-[-8deg] bg-[url('/sensor-motif.png')] bg-[length:160px_auto] bg-no-repeat opacity-[0.12]" />
      </div>

      <div className="relative z-10">
        <Link href="/" className="text-sm font-medium text-[#0f766e] hover:underline">
          ← Inapoi la pagina principala
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-[#0a2624]">Comanda FreeStyle Libre 2 Plus</h1>
        <p className="mt-2 max-w-2xl text-[#1a4d47]">
          Pret: <strong className="text-[#0a2624]">350 RON</strong> / pachet · SKU{" "}
          <strong className="text-[#0a2624]">5021791006694</strong> · Livrare PPL/DPD{" "}
          <strong className="text-[#0a2624]">40 RON</strong> (gratuita de la 5 bucati) · Fineship{" "}
          <strong className="text-[#0a2624]">200 RON</strong> (de la 6 bucati).
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="rounded-2xl border-2 border-[#0d4f4a]/10 bg-white p-4 shadow-sm lg:col-span-5">
            <Image
              src="/libre-product.png"
              alt="FreeStyle Libre 2 Plus"
              width={900}
              height={680}
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>
          <div className="rounded-2xl border border-[#de6a44]/25 bg-[#fff4ec] p-5 lg:col-span-7">
            <h2 className="text-lg font-semibold text-[#3a1d2d]">Comanda rapida si sigura</h2>
            <ul className="mt-3 grid gap-2 text-sm text-[#5c3046] sm:grid-cols-2">
              <li>✓ Confirmare imediata pe e-mail</li>
              <li>✓ Plata ramburs, transfer sau card</li>
              <li>✓ Curieri multipli (PPL, DPD, Fineship)</li>
              <li>✓ Formular securizat, proces simplu</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <OrderForm />
        </div>
      </div>
    </main>
  );
}
