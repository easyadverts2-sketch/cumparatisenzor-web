import type { Metadata } from "next";
import Image from "next/image";
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
    <main className="min-h-screen bg-gradient-to-b from-[#fff4ec] to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-[#be3f6f]">Despre noi</p>
        <h1 className="mt-2 text-4xl font-bold text-[#042f2c]">O echipa din comunitate, pentru comunitate</h1>
        <p className="mt-6 text-xl leading-relaxed text-[#14534d]">
          Suntem oameni care traiesc cu diabetul sau sunt aproape de cei care traiesc cu el. Am pornit acest
          magazin pentru ca stim cat de greu este uneori sa gasesti senzorii de care ai nevoie — si vrem sa
          reducem acest gol in Romania.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#de6a44]/30 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#042f2c]">Misiune</h2>
            <p className="mt-3 text-[#14534d]">
              Sa aducem FreeStyle Libre 2 Plus acolo unde lipseste, cu proces clar, pret transparent si
              respect pentru client.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#de6a44]/30 bg-white p-6 shadow-sm">
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

        <div className="mt-12 rounded-2xl border-2 border-[#a6445f]/15 bg-[#fff4ec] p-8">
          <h2 className="text-xl font-bold text-[#042f2c]">Resurse utile pentru viata cu diabet</h2>
          <p className="mt-3 text-[#14534d]">
            Am selectat cateva surse in limba romana care pot ajuta in viata de zi cu zi: educatie
            despre diabet, monitorizare glicemica si recomandari practice.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Centrul Antidiabetic - Scoala Pacientilor",
                url: "https://www.centrulantidiabetic.scoalapacientilor.ro/",
                desc: "Informatii educative pentru pacienti despre controlul diabetului si prevenirea complicatiilor.",
              },
              {
                title: "Rodiabet - Ghid CGM",
                url: "https://www.rodiabet.ro/",
                desc: "Portal romanesc cu articole despre tipuri de diabet, viata cu diabet, alimentatie si monitorizare.",
              },
              {
                title: "Ines Nerina - Diabetes Lifestyle Blog",
                url: "https://inesnerina.com/",
                desc: "Perspectiva personala despre viata cu diabet tip 1: rutina zilnica, tehnologie, sport si echilibru emotional.",
              },
              {
                title: "DiabetZaharat.ro - Regim alimentar",
                url: "http://www.diabetzaharat.ro/pacienti.htm",
                desc: "Resurse pentru pacienti despre alimentatie, rutina zilnica si managementul glicemiei in practica.",
              },
            ].map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#de6a44]/25 bg-white p-4 no-underline shadow-sm transition hover:border-[#be3f6f]/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.url)}`}
                    alt=""
                    width={32}
                    height={32}
                    className="mt-0.5 h-8 w-8 rounded"
                  />
                  <div>
                    <h3 className="font-semibold text-[#3a1d2d]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#5c3046]">{item.desc}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
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
              className="flex gap-3 rounded-xl border border-[#de6a44]/25 bg-white p-4 text-[#14534d] shadow-sm"
            >
              <span className="text-[#be3f6f]">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center">
          <Link href="/comanda" className="inline-flex rounded-xl bg-[#be3f6f] px-8 py-3 font-semibold text-white hover:bg-[#9d2f56]">
            Comanda
          </Link>
        </p>
      </div>
    </main>
  );
}
