import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASZF",
  description: "Altalanos szerzodesi feltetelek a szenzorvasarlas.hu oldalhoz.",
  alternates: { canonical: "/hu/aszf" },
};

export default function HuAszfPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">Altalanos Szerzodesi Feltetelek</h1>
      <p className="mt-4 text-[#14534d]">
        Utolso frissites: 2026 aprilis. Ezek a feltetelek a szenzorvasarlas.hu webaruhazban torteno online
        vasarlasokra vonatkoznak, az EU-s es a Cseh Koztarsasagban alkalmazando jogszabalyok figyelembevetelevel.
      </p>
      <div className="mt-10 space-y-5 text-[#14534d]">
        <p><strong>Uzemelteto:</strong> Ceska maloobchodni s.r.o., Braunerova 563/7, Liben (Praha 8), 180 00 Praha, ID 23504463.</p>
        <p><strong>Szerzodes nyelve:</strong> magyar. A visszaigazolo e-mail tartalmazza a rendeles fo adatait.</p>
        <p><strong>Kapcsolat:</strong> ugyfelszolgalat a <strong>/hu/kontakt</strong> oldalon. A visszakuldesi es visszateritesi ugyintezes irasban tortenik.</p>
        <p><strong>Penznem:</strong> HUF. Az arak es a szallitasi koltsegek a megrendeles veglegesitese elott jelennek meg.</p>
        <p><strong>Fizetes:</strong> utanvet vagy banki atutalas. Atutalas eseten a feladas a jovairas utan tortenik.</p>
        <p><strong>Artranszparencia:</strong> nincsenek rejtett koltsegek; a teljes fizetendo osszeg (termek + szallitas) rendeleshagyas elott lathato.</p>
        <p><strong>Szallitas:</strong> futarszolgalattal a megadott cimre. A feltuntetett szallitasi idok tajekoztato jelleguek.</p>
        <p><strong>Szallitasi feltetelek:</strong> az aktualis szallitasi dijak, esetleges ingyenes szallitasi kuszobok, valamint a kiszallitasi idobecsesek nyilvanosan elerhetok.</p>
        <p>
          <strong>Visszakuldes es visszateritesi policy:</strong> fogyasztoi vasarlasnal fobb szabaly szerint 14 napos elallasi jog all fenn,
          a jogszabalyban szereplo kivetellel (pl. bizonyos higieniai/egeszsegugyi termekek felbontasa).
        </p>
        <p>
          <strong>Kiemelt szabaly felbontott vagy hasznalt szenzorra:</strong> penzvisszafizetes vagy csere csak akkor
          lehetseges, ha a hiba foto- vagy idealisan videodokumentacioval igazolt (hibas, teves meres, indithatatlan
          vagy egyebkent nem hasznalhato allapot).
        </p>
        <p>
          Felbontott/hasznalt termek bizonyithato hiba nelkul nem jogosit visszafizetesre.
        </p>
        <p>
          Visszakuldesi igenyhez szukseges a rendelesszam es a hiba/indok leirasa. A jovahagyott visszakuldes utan az ellenorzes befejezesevel, a vonatkozo jogszabalyi hataridon belul tortenik a visszaterites.
        </p>
        <p>
          Akkor is egyertelmuen feltuntetjuk a policyt, ha adott termekre korlatozott vagy nincs altalanos visszakuldesi lehetoseg.
        </p>
        <p><strong>Szavatossag / reklamacio:</strong> a fogyasztoi jogok az alkalmazando kotelezo EU-s es nemzeti szabalyok szerint ervenyesithetok.</p>
        <p>
          <strong>Iradyo jog:</strong> Cseh jog (kulonosen a cseh polgari torvenykonyv), a fogyaszto kotelezo vedelmenek
          csorbitasa nelkul.
        </p>
      </div>
    </main>
  );
}
