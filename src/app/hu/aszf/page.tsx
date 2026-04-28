import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASZF",
  description: "Altalanos szerzodesi feltetelek a szenzorvasarlas.hu oldalhoz.",
  alternates: { canonical: "/hu/aszf" },
};

export default function HuAszfPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">Általános Szerződési Feltételek</h1>
      <p className="mt-4 text-[#14534d]">Utolsó frissítés: [dátum]</p>

      <div className="mt-8 space-y-4 text-[#14534d]">
        <p>
          Jelen Általános Szerződési Feltételek szabályozzák a Ceska maloobchodni s.r.o., székhely:
          Braunerova 563/7, Libeň, 180 00 Praha 8, Cseh Köztársaság, cégjegyzékszám / IČO: 23504463 mint
          eladó és a webáruházban vásárló természetes személy vagy vállalkozás mint vevő közötti jogviszonyt
          a szenzorvasarlas.hu webáruházban leadott megrendelések esetén.
        </p>
      </div>

      <div className="mt-10 space-y-7 text-[#14534d]">
        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">1. Bevezető rendelkezések</h2>
          <p className="mt-2">1.1. Jelen ÁSZF a webáruházon keresztül, távollévők között kötött adásvételi szerződésekre vonatkozik.</p>
          <p>1.2. A fogyasztó és az eladó közötti jogviszonyra elsősorban a Cseh Köztársaság joga, különösen a 89/2012 Sb. számú Polgári Törvénykönyv és a 634/1992 Sb. számú fogyasztóvédelmi törvény irányadó.</p>
          <p>1.3. Amennyiben a vevő nem fogyasztó, hanem vállalkozás, a jogviszonyra a Cseh Köztársaság vonatkozó polgári jogi szabályai alkalmazandók.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">2. Az eladó adatai</h2>
          <p className="mt-2">2.1. Cégnév: Ceska maloobchodni s.r.o.</p>
          <p>2.2. Székhely: Braunerova 563/7, Libeň, 180 00 Praha 8, Cseh Köztársaság</p>
          <p>2.3. IČO: 23504463</p>
          <p>2.4. E-mail: [kitöltendő]</p>
          <p>2.5. Telefonszám: [kitöltendő]</p>
          <p>2.6. Panaszkezelési és visszaküldési cím: [kitöltendő]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">3. A szerződés nyelve és létrejötte</h2>
          <p className="mt-2">3.1. A szerződés nyelve magyar. A fogyasztó felé tett tájékoztatásnak világosnak és érthetőnek kell lennie abban a nyelvben, amelyben a szerződés létrejön.</p>
          <p>3.2. A webáruházban feltüntetett termékbemutatás tájékoztató jellegű, és önmagában nem minősül az eladó részéről kötelező érvényű szerződéses ajánlatnak.</p>
          <p>3.3. A vevő megrendelésének elküldésével kötelező érvényű ajánlatot tesz a termék megvásárlására.</p>
          <p>3.4. Az adásvételi szerződés azzal jön létre, hogy az eladó a megrendelést elektronikus úton visszaigazolja.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">4. Ár, fizetés, pénznem</h2>
          <p className="mt-2">4.1. Az árak a webáruházban HUF pénznemben kerülnek feltüntetésre.</p>
          <p>4.2. A termék ára, valamint a szállítási költség a megrendelés véglegesítése előtt egyértelműen megjelenik. A teljes fizetendő összegnek a megrendelés elküldése előtt ismertnek kell lennie.</p>
          <p>4.3. Fizetési módok: banki átutalás, utánvét, egyéb, a webáruházban feltüntetett fizetési módok.</p>
          <p>4.4. Banki átutalás esetén az eladó a terméket az összeg jóváírását követően küldi meg.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">5. Szállítás</h2>
          <p className="mt-2">5.1. A megrendelt terméket az eladó a vevő által megadott címre szállíttatja.</p>
          <p>5.2. A feltüntetett szállítási idők tájékoztató jellegűek, kivéve, ha az eladó kifejezetten másként vállalja.</p>
          <p>5.3. A kárveszély a termék vevő általi átvételével száll át a vevőre.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">6. Fontos tájékoztatás a forgalmazott szenzorokról</h2>
          <p className="mt-2">6.1. Az eladó kifejezetten tájékoztatja a vevőt, hogy az értékesített szenzorok nem feltétlenül rendelkeznek magyar nyelvű csomagolással, és nem feltétlenül tartalmaznak magyar nyelvű használati útmutatót.</p>
          <p>6.2. A vevő a megrendelés elküldésével és jelen ÁSZF elfogadásával megerősíti, hogy erről a körülményről a szerződés megkötése előtt egyértelmű és érthető tájékoztatást kapott, és ezt tudomásul veszi.</p>
          <p>6.3. Jelen tájékoztatás nem korlátozza a fogyasztót megillető kötelező jogokat, és nem érinti az eladóra kötelezően irányadó jogszabályi kötelezettségeket.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">7. Elállási jog fogyasztók számára</h2>
          <p className="mt-2">7.1. A fogyasztó jogosult az adásvételi szerződéstől 14 napon belül indokolás nélkül elállni. A határidő áruk adásvétele esetén az áru átvételének napjától számítandó.</p>
          <p>7.2. A fogyasztó elállási jogát bármely egyértelmű nyilatkozattal gyakorolhatja; az eladó mintanyilatkozatot is rendelkezésre bocsáthat.</p>
          <p>7.3. Elállás esetén a fogyasztó köteles a terméket indokolatlan késedelem nélkül, legkésőbb az elállás közlésétől számított 14 napon belül visszaküldeni.</p>
          <p>7.4. Az eladó a fogyasztó által megfizetett összeget az elállás közlésétől számított legkésőbb 14 napon belül visszatéríti, de jogosult a visszatérítést a termék visszaérkezéséig vagy a visszaküldés hitelt érdemlő igazolásáig visszatartani.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">8. Elállási jog alóli kivétel</h2>
          <p className="mt-2">8.1. A fogyasztó nem jogosult elállni olyan lezárt csomagolású áru adásvételétől, amely egészségvédelmi vagy higiéniai okból a csomagolás felbontását követően nem küldhető vissza. Ez a kivétel a cseh Polgári Törvénykönyvben is szerepel.</p>
          <p>8.2. E kivétel kizárólag akkor alkalmazható, ha annak törvényi feltételei az adott terméknél ténylegesen fennállnak.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">9. Hibás teljesítés, reklamáció</h2>
          <p className="mt-2">9.1. A vevő jogosult reklamációt benyújtani különösen akkor, ha a termék hibás, nem indítható, rendellenesen működik, nem aktiválható, vagy a szerződésnek nem felel meg.</p>
          <p>9.2. A reklamáció gyorsabb elbírálása érdekében az eladó javasolja a rendelésszám, a hiba leírása, valamint lehetőség szerint fénykép vagy videó csatolását.</p>
          <p>9.3. A fénykép vagy videó bekérése a reklamáció gyorsítását szolgálja, nem zárja ki a fogyasztó törvényes jogait.</p>
          <p>9.4. A reklamáció benyújtásának módjáról, helyéről és feltételeiről az eladó a fogyasztót világosan tájékoztatja. Ez a cseh fogyasztóvédelmi szabályokból is következik.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">10. Nyitott vagy használt szenzorok</h2>
          <p className="mt-2">10.1. Ha a vevő már felbontott vagy használt szenzorra hivatkozva reklamációt nyújt be, az eladó kérheti a hiba dokumentálását, különösen fénykép vagy videó formájában.</p>
          <p>10.2. Ha a termék hibája nem áll fenn, a visszaküldés és a visszatérítés lehetősége a vonatkozó jogszabályi szabályok, különösen az elállási jog kivételei szerint kerül megítélésre.</p>
          <p>10.3. Az eladó nem zárhatja ki a fogyasztót a kötelező jogszabályi jogokból általános szerződési feltétellel.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">11. Mimosúdní řešení spotřebitelských sporů / Békéltetésen kívüli fogyasztói vitarendezés</h2>
          <p className="mt-2">11.1. A fogyasztói jogviták peren kívüli rendezésére illetékes szerv a Česká obchodní inspekce (ČOI). A cseh jog előírja, hogy az eladó erről a fogyasztót világos, érthető és könnyen hozzáférhető módon tájékoztassa.</p>
          <p>11.2. Elérhetőség: Česká obchodní inspekce, Štěpánská 15, 120 00 Praha 2, Cseh Köztársaság, Web: adr.coi.cz / coi.gov.cz</p>
          <p>11.3. A peren kívüli vitarendezés főszabály szerint díjmentes, a felek saját költségeiket maguk viselik.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">12. Záró rendelkezések</h2>
          <p className="mt-2">12.1. Jelen ÁSZF-re és az adásvételi szerződésre a Cseh Köztársaság joga irányadó.</p>
          <p>12.2. Ez nem érinti a fogyasztót megillető kötelező jogszabályi védelem alkalmazását.</p>
          <p>12.3. Az eladó jogosult jelen ÁSZF-et módosítani; a módosítás a webáruházban történő közzététellel lép hatályba a jövőbeni megrendelésekre.</p>
          <p>12.4. A vevő a megrendelés elküldésével megerősíti, hogy az ÁSZF-et megismerte és elfogadja.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0f766e]">Ajánlott checkbox szöveg</h2>
          <p className="mt-2">
            „A megrendelés elküldésével kijelentem, hogy az Általános Szerződési Feltételeket
            megismertem és elfogadom, továbbá tudomásul veszem, hogy a termék nem feltétlenül
            rendelkezik magyar nyelvű csomagolással és/vagy magyar nyelvű használati útmutatóval.”
          </p>
        </section>
      </div>
    </main>
  );
}
