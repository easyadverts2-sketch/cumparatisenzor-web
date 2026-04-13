import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Despre noi — echipa din comunitate",
  description:
    "Cine suntem: o echipa apropiata comunitatii cu diabet din Romania. Magazin pentru senzori FreeStyle Libre 2 Plus.",
  alternates: { canonical: "/despre-noi" },
  openGraph: {
    url: `${getPublicSiteUrl()}/despre-noi`,
    title: `Despre noi | ${SITE_NAME}`,
    description: "O echipa din comunitate, pentru comunitate — livrare senzori Libre in Romania.",
  },
};

export default function DespreNoiPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0fdfa] to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-[#0f766e]">Despre noi</p>
        <h1 className="mt-2 text-4xl font-bold text-[#042f2c]">O echipa din comunitate, pentru comunitate</h1>
        <p className="mt-6 text-xl leading-relaxed text-[#14534d]">
          Suntem oameni care traiesc cu diabetul sau sunt aproape de cei care traiesc cu el. Am pornit acest
          magazin pentru ca stim cat de greu este uneori sa gasesti senzorii de care ai nevoie — si vrem sa
          reducem acest gol in Romania.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#0d9488]/25 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#042f2c]">Misiune</h2>
            <p className="mt-3 text-[#14534d]">
              Sa aducem FreeStyle Libre 2 Plus acolo unde lipseste, cu proces clar, pret transparent si
              respect pentru client.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#0d9488]/25 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#042f2c]">Operator legal</h2>
            <p className="mt-3 text-[#14534d]">
              Magazinul este operat de{" "}
              <strong className="text-[#042f2c]">Česká maloobchodní s.r.o.</strong>
              <br />
              Braunerova 563/7, Libeň (Praha 8), 180 00 Praha
              <br />
              ID: 23504463
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border-2 border-[#0d4f4a]/10 bg-[#ecfdf5] p-8">
          <h2 className="text-xl font-bold text-[#042f2c]">Ce putem imbunatati impreuna</h2>
          <p className="mt-3 text-[#14534d]">
            Daca doriti, putem adauga aici: fotografie de echipa (cu acord), povesti scurte ale clientilor,
            parteneriate cu asociatii de diabet sau link-uri catre resurse educationale verificate. Spuneti-ne
            ce ati vrea sa vada vizitatorii — construim pagina impreuna.
          </p>
        </div>

        <h2 className="mt-14 text-2xl font-bold text-[#042f2c]">Etape planificate</h2>
        <ul className="mt-6 space-y-4">
          {[
            "Helpdesk fluent in limba romana.",
            "Depozit in Bucuresti pentru timp de livrare mai scurt.",
            "Cooperare cu producatorul si distributie catre farmacii si diabetologi.",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-[#0d9488]/20 bg-white p-4 text-[#14534d] shadow-sm"
            >
              <span className="text-[#0d9488]">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center">
          <Link href="/comanda" className="inline-flex rounded-xl bg-[#0d9488] px-8 py-3 font-semibold text-white">
            Comanda
          </Link>
        </p>
      </div>
    </main>
  );
}
