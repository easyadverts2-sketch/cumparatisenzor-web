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
        Ez a tajekoztato ismerteti, hogyan kezeljuk a szemelyes adatokat a GDPR (EU 2016/679) es a
        vonatkozo cseh adatvedelmi jogszabalyok szerint.
      </p>
      <div className="mt-10 space-y-5 text-[#14534d]">
        <p><strong>Adatkezelo:</strong> Ceska maloobchodni s.r.o., Braunerova 563/7, Liben (Praha 8), 180 00 Praha, ID 23504463.</p>
        <p><strong>Kapcsolat adatvedelmi ugyekben:</strong> kapcsolatfelvetel a <strong>/hu/kontakt</strong> oldalon keresztul.</p>
        <p><strong>Kezelt adatok:</strong> nev, e-mail, telefonszam, szallitasi es szamlazasi cim, rendelesei adatok, ugyfelszolgalati kommunikacio.</p>
        <p><strong>Fizetesi adatok:</strong> bankkartya-adatokat nem tarolunk a sajat szerveren; azokat minositett fizetesi szolgaltato kezeli.</p>
        <p><strong>Adatkezeles celjai:</strong> rendeles teljesitese, szallitas megszervezese, visszakuldes/visszaterites ugyintezese, jogi kotelezettsegek teljesitese, csalasmaegelozes es rendszerbiztonsag.</p>
        <p><strong>Jogalap:</strong> szerzodes teljesitese, jogi kotelezettseg, jogos erdek (biztonsag, visszaeles-megelozes), hozzajarulas (ha marketinghez szukseges).</p>
        <p><strong>Adatfeldolgozok:</strong> futarszolgalatok, fizetesi szolgaltatok, IT/hosting szolgaltatok, email szolgaltatok.</p>
        <p><strong>Adatminimalizalas:</strong> csak a szolgaltatas teljesitesehez szukseges adatokat osztjuk meg a partnerekkel.</p>
        <p><strong>Megorzes:</strong> az adatokat a jogszabalyi kotelezettsegeknek megfelelo ideig orizzuk; ezt kovetoen toroljuk vagy anonimizaljuk. A reklamacios/visszakuldesi adatok megorzese az ugyintezeshez es jogervenyesiteshez szukseges ideig tart.</p>
        <p><strong>Erintetti jogok:</strong> hozzaferes, helyesbites, torles, korlatozas, adathordozhatosag, tiltakozas, panasztetel.</p>
        <p><strong>Azonositas:</strong> joggyakorlasi kerelemnel minimalis azonositast kerhetunk az adatok vedelme erdekeben.</p>
        <p><strong>Felugyeleti hatosag:</strong> UOOU (Cseh adatvedelmi hatosag) - https://www.uoou.cz.</p>
      </div>
    </main>
  );
}
