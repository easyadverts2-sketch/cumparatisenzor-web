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
      <h1 className="text-4xl font-bold text-[#042f2c]">Termeni si conditii de utilizare</h1>
      <p className="mt-4 text-[#14534d]">
        Ultima actualizare: aprilie 2026. Acesti termeni reglementeaza vanzarea online a produselor prin
        cumparatisenzor.ro, cu respectarea legislatiei UE si a legislatiei aplicabile din Republica Ceha.
      </p>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">1. Date despre operator</h2>
        <p>
          Magazinul online (site-ul) este operat de{" "}
          <strong className="text-[#042f2c]">Česká maloobchodní s.r.o.</strong>, cu sediul social la Braunerova
          563/7, Libeň (Praha 8), 180 00 Praha, Republica Ceha, identificator: <strong>23504463</strong> (denumita in
          continuare „Vanzatorul”).
        </p>
        <p>
          Contact pentru comenzi si intrebari: prin functionalitatile site-ului si la adresa de e-mail indicata pe
          site. Limba principala a contractului la distanta este romana.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">2. Aplicabilitate si definiri</h2>
        <p>
          Prezentii termeni se aplica tuturor comenzilor plasate prin site. Prin trimiterea comenzii, Cumparatorul
          confirma ca a citit si a acceptat acesti termeni si politica GDPR.
        </p>
        <p>
          Cumparatorul poate actiona ca persoana fizica (consumator) sau in cadrul unei activitati economice.
          Drepturile consumatorilor raman protejate de normele imperative aplicabile in statul de resedinta.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">3. Produse si disponibilitate</h2>
        <p>
          Produsele sunt describe pe site (denumire, pret, livrare). Stocul este limitat; in caz de indisponibilitate
          veti fi informat prin e-mail, iar comanda poate fi anulata sau amanata conform comunicarii noastre.
        </p>
        <p>
          Dispozitivele medicale trebuie utilizate conform instructiunilor producatorului si recomandarilor
          medicului dumneavoastra. Site-ul nu inlocuieste sfatul medical.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">4. Preturi, taxe si plata</h2>
        <p>
          Preturile sunt afisate in <strong>RON</strong>, inclusiv TVA daca este cazul conform legislatiei aplicabile.
          Costurile de livrare sunt indicate inainte de finalizarea comenzii.
        </p>
        <p>
          Metode de plata disponibile: <strong>ramburs</strong> (la livrare) si <strong>transfer bancar</strong>. Pentru
          transfer bancar, expedierea poate avea loc dupa confirmarea platii in contul Vanzatorului. In cazul neplatii
          in termenul comunicat, comanda poate fi anulata.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">5. Comanda si incheierea contractului</h2>
        <p>
          Comanda reprezinta o oferta din partea dumneavoastra. Contractul este considerat incheiat la primirea
          confirmarii comenzii (de exemplu prin e-mail), sub rezerva verificarilor de plata si stoc.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">6. Livrare</h2>
        <p>
          Livrarea se face prin curier, la adresa indicata. Termenele estimate afisate pe site sunt orientative;
          intarzieri independente de vointa noastra pot aparea (curier, forta majora, sarbatori legale etc.).
        </p>
        <p>
          Riscul privind produsul trece la Cumparator la momentul predarii coletului de catre curier.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">7. Retragere, retur si produse desigilate</h2>
        <p>
          Consumatorul are, in principiu, drept de retragere in 14 zile de la primirea produsului, cu exceptiile
          prevazute de legislatia aplicabila pentru produse de natura sanitara/medicala desigilate.
        </p>
        <p>
          <strong>Clauza speciala pentru senzori deschisi sau utilizati:</strong> pentru senzori desigilati /
          utilizati, returnarea banilor sau inlocuirea cu un senzor nou se acorda numai daca defectul este dovedit
          prin documentare clara, ideal video, sau cel putin foto (de exemplu: eroare la pornire, functionare
          defectuoasa, produs neutilizabil).
        </p>
        <p>
          In lipsa dovezilor obiective privind defectul, produsul desigilat/utilizat nu poate fi acceptat la retur
          pentru rambursare.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">8. Reclamatii si garantii</h2>
        <p>
          Pentru defecte de conformitate sau produse defecte, puteti contacta Vanzatorul la datele de contact.
          Termenele legale privind garantia consumatorului sunt cele aplicabile in tara dumneavoastra de
          resedinta, in limitele legii.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">9. Limitarea raspunderii</h2>
        <p>
          Vanzatorul nu raspunde pentru daune indirecte sau pierderi de profit. Raspunderea pentru produse este
          cea prevazuta de lege. Continutul informational de pe site are scop general si nu inlocuieste sfatul
          medical.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">10. Lege aplicabila, solutionarea litigiilor</h2>
        <p>
          Raporturile contractuale sunt guvernate de legislatia Republicii Cehe (in special Codul civil ceh),
          fara a afecta protectia minima obligatorie acordata consumatorilor prin normele UE si nationale aplicabile.
        </p>
        <p>
          Consumatorii pot utiliza mecanisme de solutionare alternativa a litigiilor si platforma ODR:
          https://ec.europa.eu/consumers/odr.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">11. Modificari</h2>
        <p>
          Ne rezervam dreptul de a actualiza acesti termeni. Versiunea aplicabila este cea publicata pe site la
          data comenzii dumneavoastra.
        </p>
      </section>
    </main>
  );
}
