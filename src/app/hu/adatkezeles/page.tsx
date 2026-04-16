import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatkezeles",
  description: "GDPR kompatibilis adatkezelesi tajekoztato a szenzorvasarlas.hu oldalon.",
  alternates: { canonical: "/hu/adatkezeles" },
};

export default function HuPrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">Adatkezelesi tajekoztato</h1>
      <p className="mt-4 text-[#14534d]">
        Az adatokat a rendelesek feldolgozasahoz, szallitashoz es ugyfelszolgalati kommunikaciohoz kezeljuk.
      </p>
      <div className="mt-10 space-y-5 text-[#14534d]">
        <p><strong>Adatkezelo:</strong> Ceska maloobchodni s.r.o., Praha, ID 23504463.</p>
        <p><strong>Kezelt adatok:</strong> nev, telefonszam, e-mail, szallitasi es szamlazasi cim, rendelesi adatok.</p>
        <p><strong>Jogalap:</strong> szerzodes teljesitese, jogi kotelezettseg, jogos erdek.</p>
        <p><strong>Erintetti jogok:</strong> hozzaferes, helyesbites, torles, korlatozas, adathordozhatosag, panasztetel.</p>
      </div>
    </main>
  );
}
