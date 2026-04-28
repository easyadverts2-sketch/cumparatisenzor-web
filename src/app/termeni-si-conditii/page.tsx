import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Termeni si conditii",
  description:
    "Termeni si conditii de utilizare a magazinului online Senzori Libre Romania, livrare si plata.",
  alternates: { canonical: "/termeni-si-conditii" },
  openGraph: {
    url: `${getPublicSiteUrl()}/termeni-si-conditii`,
    title: `Termeni si conditii | ${SITE_NAME}`,
    description: "Conditii comerciale si utilizare site.",
  },
};

export default function TermeniPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">Termeni și condiții generale</h1>
      <p className="mt-4 text-[#14534d]">Ultima actualizare: [de completat]</p>

      <div className="mt-8 space-y-4 text-[#14534d]">
        <p>
          Prezentele Termeni și condiții generale reglementează raporturile juridice dintre Ceska maloobchodni
          s.r.o., cu sediul social la Braunerova 563/7, Libeň, 180 00 Praha 8, Republica Cehă, număr de
          identificare / IČO: 23504463, în calitate de vânzător, și clientul care cumpără produse prin
          intermediul magazinului online [domeniul pentru versiunea română], în calitate de cumpărător.
        </p>
      </div>

      <div className="mt-10 space-y-7 text-[#14534d]">
        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">1. Dispoziții introductive</h2>
          <p className="mt-2">1.1. Prezentii termeni și condiții se aplică contractelor de vânzare încheiate la distanță prin intermediul magazinului online.</p>
          <p>1.2. Raporturile juridice dintre vânzător și clientul care are calitatea de consumator se supun în principal legislației Republicii Cehe, în special Legii nr. 89/2012 Sb., Codul civil ceh, și Legii nr. 634/1992 Sb. privind protecția consumatorului.</p>
          <p>1.3. În cazul în care cumpărătorul este antreprenor, raportul juridic se supune dispozițiilor relevante ale dreptului civil ceh.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">2. Datele vânzătorului</h2>
          <p className="mt-2">2.1. Denumire: Ceska maloobchodni s.r.o.</p>
          <p>2.2. Sediu social: Braunerova 563/7, Libeň, 180 00 Praha 8, Republica Cehă</p>
          <p>2.3. IČO: 23504463</p>
          <p>2.4. E-mail: [de completat]</p>
          <p>2.5. Telefon: [de completat]</p>
          <p>2.6. Adresă pentru reclamații și retururi: [de completat]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">3. Limba contractului și încheierea contractului</h2>
          <p className="mt-2">3.1. Limba contractului este româna.</p>
          <p>3.2. Prezentarea produselor în magazinul online are caracter informativ și nu reprezintă, prin ea însăși, o ofertă obligatorie a vânzătorului de a încheia contractul.</p>
          <p>3.3. Prin trimiterea comenzii, cumpărătorul formulează o ofertă obligatorie de cumpărare a bunurilor selectate.</p>
          <p>3.4. Contractul de vânzare se consideră încheiat în momentul în care vânzătorul confirmă primirea comenzii prin mijloace electronice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">4. Prețuri, monedă și condiții de plată</h2>
          <p className="mt-2">4.1. Prețurile produselor sunt afișate în RON [sau completați moneda corectă, dacă este alta].</p>
          <p>4.2. Prețul produsului și costurile de livrare sunt afișate în mod clar înainte de finalizarea comenzii. Suma totală de plată trebuie să fie cunoscută clientului înainte de trimiterea comenzii.</p>
          <p>4.3. Metode de plată: transfer bancar, ramburs, alte metode afișate în magazinul online.</p>
          <p>4.4. În cazul plății prin transfer bancar, marfa este expediată după creditarea integrală a sumei în contul vânzătorului.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">5. Livrarea</h2>
          <p className="mt-2">5.1. Produsele comandate sunt livrate la adresa indicată de cumpărător în comandă.</p>
          <p>5.2. Termenele de livrare afișate sunt orientative, cu excepția cazului în care vânzătorul indică în mod expres altfel.</p>
          <p>5.3. Riscul de deteriorare a bunurilor trece asupra cumpărătorului în momentul preluării bunurilor.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">6. Informare importantă privind senzorii comercializați</h2>
          <p className="mt-2">6.1. Vânzătorul informează în mod expres cumpărătorul că senzorii comercializați pot să nu aibă ambalaj în limba română și pot să nu includă instrucțiuni de utilizare în limba română.</p>
          <p>6.2. Prin trimiterea comenzii și acceptarea prezentelor termeni și condiții, cumpărătorul confirmă că a fost informat în mod clar și inteligibil, înainte de încheierea contractului, cu privire la această împrejurare și că o ia la cunoștință.</p>
          <p>6.3. Această informare nu limitează drepturile imperative ale consumatorului și nu afectează obligațiile legale obligatorii care incumbă vânzătorului.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">7. Dreptul consumatorului de retragere din contract</h2>
          <p className="mt-2">7.1. Consumatorul are dreptul să se retragă din contractul de vânzare încheiat la distanță în termen de 14 zile, fără a invoca un motiv. Termenul curge, în cazul vânzării de bunuri, de la data preluării bunurilor.</p>
          <p>7.2. Consumatorul își poate exercita dreptul de retragere prin orice declarație neechivocă; vânzătorul poate pune la dispoziție și un formular-tip, fără ca utilizarea acestuia să fie obligatorie.</p>
          <p>7.3. În caz de retragere, consumatorul este obligat să trimită sau să predea bunurile vânzătorului fără întârzieri nejustificate, cel târziu în termen de 14 zile de la data notificării retragerii.</p>
          <p>7.4. Vânzătorul restituie toate sumele primite de la consumator fără întârzieri nejustificate, cel târziu în termen de 14 zile de la retragere, însă este îndreptățit să amâne restituirea până la primirea bunurilor sau până la dovada expedierii acestora de către consumator.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">8. Excepție de la dreptul de retragere</h2>
          <p className="mt-2">8.1. Consumatorul nu poate să se retragă din contract în cazul livrării de bunuri sigilate care, din motive de protecție a sănătății sau de igienă, nu pot fi returnate după desigilare. Această excepție există și în dreptul ceh.</p>
          <p>8.2. Această excepție se aplică numai dacă, în cazul concret, sunt îndeplinite efectiv condițiile prevăzute de lege.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">9. Reclamații și executare necorespunzătoare</h2>
          <p className="mt-2">9.1. Cumpărătorul are dreptul să formuleze o reclamație în special în cazul în care produsul este defect, nu poate fi pornit, funcționează necorespunzător, nu poate fi activat sau nu corespunde contractului.</p>
          <p>9.2. Pentru accelerarea soluționării reclamației, vânzătorul recomandă indicarea numărului comenzii, descrierea defectului și, dacă este posibil, atașarea de fotografii sau materiale video.</p>
          <p>9.3. Solicitarea unei fotografii sau a unui material video are doar rol practic și de probare rapidă și nu exclude drepturile legale ale consumatorului.</p>
          <p>9.4. Informațiile privind modalitatea, locul și condițiile de soluționare a reclamațiilor trebuie comunicate în mod clar consumatorului.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">10. Senzori deschiși sau utilizați</h2>
          <p className="mt-2">10.1. Dacă cumpărătorul formulează o reclamație cu privire la un senzor deja desigilat sau utilizat, vânzătorul poate solicita documentarea defectului, în special prin fotografie sau video.</p>
          <p>10.2. Dacă produsul nu prezintă defect, posibilitatea returnării și a rambursării se apreciază conform normelor legale aplicabile, în special conform regulilor privind excepțiile de la dreptul de retragere.</p>
          <p>10.3. Vânzătorul nu poate exclude prin clauze contractuale drepturile imperative conferite consumatorului de lege.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">11. Soluționarea extrajudiciară a litigiilor de consum</h2>
          <p className="mt-2">11.1. Autoritatea competentă pentru soluționarea extrajudiciară a litigiilor de consum rezultate din contractul de vânzare este Česká obchodní inspekce (Inspecția Comercială Cehă – ČOI). Dreptul ceh impune informarea consumatorului cu privire la această posibilitate într-un mod clar, ușor accesibil și inteligibil.</p>
          <p>11.2. Date de contact: Česká obchodní inspekce, Štěpánská 15, 120 00 Praha 2, Republica Cehă, Website: adr.coi.cz / coi.gov.cz</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#042f2c]">12. Dispoziții finale</h2>
          <p className="mt-2">12.1. Prezentii termeni și condiții și contractul de vânzare se supun dreptului Republicii Cehe.</p>
          <p>12.2. Aceasta nu aduce atingere protecției imperative acordate consumatorului de normele juridice aplicabile.</p>
          <p>12.3. Vânzătorul este îndreptățit să modifice prezentele termeni și condiții; modificările se aplică comenzilor viitoare de la data publicării lor în magazinul online.</p>
          <p>12.4. Prin trimiterea comenzii, cumpărătorul confirmă că a citit și acceptă prezentele termeni și condiții.</p>
        </section>
      </div>
    </main>
  );
}
