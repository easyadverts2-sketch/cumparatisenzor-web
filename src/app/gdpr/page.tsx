import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Politica de confidentialitate (GDPR)",
  description:
    "Prelucrarea datelor personale la cumparatisenzor.ro: operator, drepturi, contact conform GDPR.",
  alternates: { canonical: "/gdpr" },
  openGraph: {
    url: `${getPublicSiteUrl()}/gdpr`,
    title: `GDPR | ${SITE_NAME}`,
    description: "Politica de confidentialitate si prelucrare date personale.",
  },
};

export default function GdprPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">RO – Politica de confidențialitate</h1>
      <p className="mt-4 text-[#14534d]">Ultima actualizare: [de completat]</p>
      <p className="mt-4 text-[#14534d]">
        Această Politică de confidențialitate explică modul în care societatea Ceska maloobchodni s.r.o., cu sediul social la Braunerova 563/7, Libeň, 180 00 Praha 8, Republica Cehă, IČO 23504463, în calitate de operator de date cu caracter personal, prelucrează datele dumneavoastră personale în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și cu legislația Republicii Cehe, în special Legea nr. 110/2019 Sb., privind prelucrarea datelor cu caracter personal.
      </p>

      <div className="mt-10 space-y-7 text-[#14534d]">
        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">1. Operatorul datelor</h2>
          <p className="mt-2">Ceska maloobchodni s.r.o.</p>
          <p>Braunerova 563/7, Libeň, 180 00 Praha 8, Republica Cehă</p>
          <p>IČO: 23504463</p>
          <p>E-mail: [de completat]</p>
          <p>Telefon: [de completat]</p>
          <p className="mt-2">Pentru solicitări privind datele personale ne puteți contacta prin formularul de contact disponibil pe site sau prin datele de contact de mai sus.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">2. Ce date prelucrăm</h2>
          <p className="mt-2">Putem prelucra în special următoarele categorii de date:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>nume și prenume,</li>
            <li>adresă de facturare și adresă de livrare,</li>
            <li>adresă de e-mail,</li>
            <li>număr de telefon,</li>
            <li>date despre comenzi și produsele cumpărate,</li>
            <li>date privind comunicarea cu serviciul clienți,</li>
            <li>date privind plățile, în măsura necesară pentru procesarea lor,</li>
            <li>date tehnice privind utilizarea site-ului, în măsura necesară pentru funcționarea și securitatea acestuia.</li>
          </ul>
          <p className="mt-2">Nu stocăm pe serverele noastre date complete ale cardurilor de plată; acestea sunt procesate de furnizorii autorizați de servicii de plată, dacă această metodă de plată este disponibilă. Prelucrarea trebuie să fie limitată la ceea ce este necesar și să respecte principiile GDPR, inclusiv minimizarea datelor.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">3. Scopurile prelucrării și temeiul juridic</h2>
          <p className="mt-2"><strong>a) Executarea comenzii și a contractului de vânzare</strong><br />Pentru primirea, confirmarea, procesarea și livrarea comenzii, precum și pentru comunicarea referitoare la comanda dumneavoastră.<br />Temei juridic: executarea contractului sau efectuarea de demersuri la cererea persoanei vizate înainte de încheierea contractului, conform art. 6 alin. 1 lit. b GDPR.</p>
          <p><strong>b) Îndeplinirea obligațiilor legale</strong><br />Pentru emiterea documentelor fiscale, evidență contabilă, soluționarea reclamațiilor și îndeplinirea altor obligații prevăzute de lege.<br />Temei juridic: îndeplinirea unei obligații legale conform art. 6 alin. 1 lit. c GDPR. Evidențele contabile sunt păstrate în termenele impuse de legislația cehă privind contabilitatea.</p>
          <p><strong>c) Protejarea securității site-ului și prevenirea fraudelor</strong><br />Pentru protejarea infrastructurii IT, prevenirea abuzurilor, apărarea drepturilor noastre și gestionarea eventualelor litigii.<br />Temei juridic: interesul nostru legitim conform art. 6 alin. 1 lit. f GDPR.</p>
          <p><strong>d) Comunicări comerciale</strong><br />Pentru trimiterea de mesaje comerciale sau newslettere, în măsura permisă de lege.<br />Temei juridic: consimțământul dumneavoastră conform art. 6 alin. 1 lit. a GDPR sau, dacă legea permite, interesul legitim pentru promovarea propriilor produse similare, cu posibilitatea clară de dezabonare.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">4. Cui putem transmite datele</h2>
          <p className="mt-2">Putem transmite datele personale numai în măsura necesară către:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>firme de curierat și transport,</li>
            <li>furnizori de servicii de plată,</li>
            <li>furnizori IT, hosting și e-mail,</li>
            <li>contabili, consultanți sau furnizori de software,</li>
            <li>autorități publice, dacă acest lucru este cerut de lege.</li>
          </ul>
          <p className="mt-2">Transmiterea este limitată la datele necesare pentru scopul respectiv. Acești destinatari acționează fie ca persoane împuternicite de operator, fie ca operatori independenți, în funcție de rolul lor.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">5. Transferuri în afara SEE</h2>
          <p className="mt-2">Dacă, în mod excepțional, datele sunt transferate în afara Spațiului Economic European, vom face acest lucru numai dacă există un mecanism legal adecvat, de exemplu:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>o decizie de adecvare a Comisiei Europene, sau</li>
            <li>clauze contractuale standard ori alte garanții adecvate prevăzute de GDPR.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">6. Perioada de păstrare</h2>
          <p className="mt-2">Păstrăm datele personale numai pe perioada necesară pentru scopul respectiv:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>datele aferente comenzilor și documentelor fiscale pe durata impusă de legislația contabilă și fiscală aplicabilă,</li>
            <li>datele privind reclamațiile pe perioada necesară pentru soluționare și pentru apărarea eventualelor pretenții legale,</li>
            <li>datele utilizate pentru comunicări comerciale până la retragerea consimțământului sau până la formularea opoziției, după caz,</li>
            <li>datele tehnice și de securitate numai atât timp cât este necesar pentru protejarea site-ului și demonstrarea conformității.</li>
          </ul>
          <p className="mt-2">În Republica Cehă, registrele și documentele contabile sunt păstrate în termene legale specifice; pentru multe documente contabile termenul standard este 5 ani, iar pentru anumite documente-cheie 10 ani.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">7. Drepturile dumneavoastră</h2>
          <p className="mt-2">În condițiile prevăzute de GDPR, aveți dreptul:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>de acces la datele personale,</li>
            <li>la rectificarea datelor inexacte,</li>
            <li>la ștergerea datelor,</li>
            <li>la restricționarea prelucrării,</li>
            <li>la portabilitatea datelor,</li>
            <li>la opoziție față de prelucrarea întemeiată pe interes legitim,</li>
            <li>de a retrage consimțământul în orice moment, dacă prelucrarea se bazează pe consimțământ.</li>
          </ul>
          <p className="mt-2">GDPR cere ca aceste drepturi să fie puse la dispoziția persoanelor vizate într-o formă clară și accesibilă.</p>
          <p>Pentru a proteja datele personale împotriva accesului neautorizat, putem solicita informații minime pentru verificarea identității înainte de a răspunde unei cereri.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">8. Autoritatea de supraveghere</h2>
          <p className="mt-2">Aveți dreptul de a depune o plângere la autoritatea de supraveghere competentă. În Republica Cehă aceasta este:</p>
          <p>Úřad pro ochranu osobních údajů (ÚOOÚ)</p>
          <p>Pplk. Sochora 27, 170 00 Praha 7, Republica Cehă</p>
          <p>Website: uoou.gov.cz</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">9. Cookies și tehnologii similare</h2>
          <p className="mt-2">Dacă site-ul utilizează cookies sau tehnologii similare, informațiile detaliate ar trebui prezentate într-o politică separată sau într-o secțiune distinctă. Pentru cookies strict necesare nu este, în principiu, necesar consimțământul, dar pentru cookies analitice sau de marketing se aplică reguli suplimentare potrivit legislației privind comunicațiile electronice.</p>
        </section>
      </div>
    </main>
  );
}
