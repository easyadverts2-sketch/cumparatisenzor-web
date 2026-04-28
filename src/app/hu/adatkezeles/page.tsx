import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatkezeles",
  description: "GDPR kompatibilis adatkezelesi tajekoztato a szenzorvasarlas.hu oldalon.",
  alternates: { canonical: "/hu/adatkezeles" },
};

export default function HuPrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">HU – Adatkezelési tájékoztató</h1>
      <p className="mt-4 text-[#14534d]">Utolsó frissítés: [kitöltendő]</p>
      <p className="mt-4 text-[#14534d]">
        Jelen Adatkezelési tájékoztató ismerteti, hogy a Ceska maloobchodni s.r.o., székhely: Braunerova
        563/7, Libeň, 180 00 Praha 8, Cseh Köztársaság, IČO: 23504463, mint adatkezelő, hogyan kezeli a
        személyes adatokat a GDPR, azaz az (EU) 2016/679 rendelet, valamint a cseh jog, különösen a
        110/2019 Sb. számú, személyes adatok kezeléséről szóló törvény alapján.
      </p>

      <div className="mt-10 space-y-7 text-[#14534d]">
        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">1. Az adatkezelő adatai</h2>
          <p className="mt-2">Ceska maloobchodni s.r.o.</p>
          <p>Braunerova 563/7, Libeň, 180 00 Praha 8, Cseh Köztársaság</p>
          <p>IČO: 23504463</p>
          <p>E-mail: [kitöltendő]</p>
          <p>Telefonszám: [kitöltendő]</p>
          <p className="mt-2">Adatvédelmi kérelmekkel kapcsolatban a weboldalon található kapcsolatfelvételi űrlapon vagy a fenti elérhetőségeken léphet velünk kapcsolatba.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">2. Milyen adatokat kezelünk</h2>
          <p className="mt-2">Különösen az alábbi személyes adatokat kezelhetjük:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>név és vezetéknév,</li>
            <li>számlázási és szállítási cím,</li>
            <li>e-mail-cím,</li>
            <li>telefonszám,</li>
            <li>rendelési adatok és a megrendelt termékek adatai,</li>
            <li>ügyfélszolgálati kommunikáció tartalma,</li>
            <li>fizetéssel kapcsolatos adatok a szükséges mértékben,</li>
            <li>a weboldal működéséhez és biztonságához szükséges technikai adatok.</li>
          </ul>
          <p className="mt-2">A teljes bankkártyaadatokat nem tároljuk a saját szervereinken; azokat az engedéllyel rendelkező fizetési szolgáltatók kezelik, ha ilyen fizetési mód elérhető. A GDPR megköveteli, hogy az adatkezelés szükséges és arányos legyen, valamint megfeleljen az adattakarékosság elvének.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">3. Az adatkezelés céljai és jogalapjai</h2>
          <p className="mt-2"><strong>a) Megrendelések és szerződések teljesítése</strong><br />A megrendelés fogadása, visszaigazolása, feldolgozása, kiszállítása és az ehhez kapcsolódó kommunikáció.<br />Jogalap: a szerződés teljesítése, illetve a szerződéskötést megelőző lépések megtétele az érintett kérésére a GDPR 6. cikk (1) bekezdés b) pontja alapján.</p>
          <p><strong>b) Jogi kötelezettségek teljesítése</strong><br />Számlázás, könyvelés, reklamációkezelés és egyéb jogszabályi kötelezettségek teljesítése.<br />Jogalap: jogi kötelezettség teljesítése a GDPR 6. cikk (1) bekezdés c) pontja alapján. A cseh számviteli jogszabályok meghatározzák egyes bizonylatok megőrzési idejét.</p>
          <p><strong>c) Weboldalbiztonság, visszaélések és csalások megelőzése</strong><br />IT-biztonság, a platform védelme, visszaélések megelőzése, jogaink érvényesítése.<br />Jogalap: jogos érdek a GDPR 6. cikk (1) bekezdés f) pontja alapján.</p>
          <p><strong>d) Marketing és kereskedelmi kommunikáció</strong><br />Hírlevelek és kereskedelmi üzenetek küldése a jogszabályok keretei között.<br />Jogalap: az érintett hozzájárulása a GDPR 6. cikk (1) bekezdés a) pontja alapján, vagy ahol ezt a jog lehetővé teszi, saját hasonló termékekre vonatkozó jogos érdek, egyértelmű leiratkozási lehetőséggel.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">4. Kik részére továbbíthatjuk az adatokat</h2>
          <p className="mt-2">A személyes adatokat kizárólag a szükséges mértékben továbbíthatjuk:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>futár- és szállítmányozó cégeknek,</li>
            <li>fizetési szolgáltatóknak,</li>
            <li>IT-, hosting- és e-mail-szolgáltatóknak,</li>
            <li>könyvelőknek, tanácsadóknak vagy szoftverszolgáltatóknak,</li>
            <li>hatóságoknak, ha ezt jogszabály előírja.</li>
          </ul>
          <p className="mt-2">Az adatokat mindig csak a konkrét cél teljesítéséhez szükséges körben osztjuk meg. Az egyes címzettek adatfeldolgozóként vagy önálló adatkezelőként járhatnak el a szerepüktől függően.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">5. Nemzetközi adattovábbítás</h2>
          <p className="mt-2">Ha kivételesen az Európai Gazdasági Térségen kívülre történik adattovábbítás, azt csak megfelelő jogi garanciák mellett végezzük, például:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>az Európai Bizottság megfelelőségi határozata alapján, vagy</li>
            <li>általános szerződési feltételek, illetve más, a GDPR által elismert megfelelő garanciák alapján.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">6. Megőrzési idő</h2>
          <p className="mt-2">A személyes adatokat csak a szükséges ideig őrizzük meg:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>a megrendelési és számlázási adatokat a számviteli és adójogi kötelezettségek teljesítéséhez szükséges ideig,</li>
            <li>a reklamációs adatokat az ügyintézéshez és az esetleges jogi igények védelméhez szükséges ideig,</li>
            <li>a marketingcélú adatokat a hozzájárulás visszavonásáig vagy a tiltakozásig,</li>
            <li>a technikai és biztonsági adatokat a weboldal védelméhez és a megfelelés igazolásához szükséges ideig.</li>
          </ul>
          <p className="mt-2">A cseh számviteli szabályok bizonyos dokumentumok esetében jellemzően 5 éves, egyes kulcsfontosságú dokumentumoknál 10 éves megőrzési időt írnak elő.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">7. Az érintettek jogai</h2>
          <p className="mt-2">A GDPR alapján Önt az alábbi jogok illetik meg:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>hozzáféréshez való jog,</li>
            <li>helyesbítéshez való jog,</li>
            <li>törléshez való jog,</li>
            <li>az adatkezelés korlátozásához való jog,</li>
            <li>adathordozhatósághoz való jog,</li>
            <li>tiltakozáshoz való jog a jogos érdeken alapuló adatkezeléssel szemben,</li>
            <li>a hozzájárulás bármikori visszavonásának joga, ha az adatkezelés hozzájáruláson alapul.</li>
          </ul>
          <p className="mt-2">Az adatkezelő köteles ezeket a jogokat egyértelműen és hozzáférhető módon ismertetni.</p>
          <p>A kérelmek teljesítése előtt a személyes adatok védelme érdekében minimális azonosítást kérhetünk.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">8. Felügyeleti hatóság</h2>
          <p className="mt-2">Ön jogosult panaszt benyújtani az illetékes felügyeleti hatósághoz. A Cseh Köztársaságban ez:</p>
          <p>Úřad pro ochranu osobních údajů (ÚOOÚ)</p>
          <p>Pplk. Sochora 27, 170 00 Praha 7, Cseh Köztársaság</p>
          <p>Weboldal: uoou.gov.cz</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">9. Cookie-k és hasonló technológiák</h2>
          <p className="mt-2">Ha a weboldal cookie-kat vagy hasonló technológiákat használ, az ezekre vonatkozó részletes információkat külön cookie-tájékoztatóban vagy külön szakaszban célszerű feltüntetni. A működéshez feltétlenül szükséges cookie-k esetében jellemzően nincs szükség hozzájárulásra, de az analitikai vagy marketing cookie-kra további szabályok vonatkoznak az elektronikus hírközlési jog alapján.</p>
        </section>
      </div>
    </main>
  );
}
