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
        Ultima actualizare: aprilie 2026. Document informativ — pentru versiune juridica definitiva, consultati un
        avocat in materie comerciala si de protectie a consumatorilor in Romania si in Cehia.
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
        <h2 className="text-xl font-semibold text-[#042f2c]">2. Domeniul de aplicare</h2>
        <p>
          Prezentii termeni reglementeaza utilizarea site-ului si incheierea contractelor la distanta pentru
          produsele oferite. Prin plasarea unei comenzi, declarati ca ati citit si acceptat acesti termeni si
          politica de confidentialitate (GDPR).
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
          Livrarea se face prin curier, la adresa indicata. Termenele estimate (ex. 3-5 zile lucratoare) sunt
          orientative; intarzieri independente de vointa noastra pot aparea. Expedierea poate fi din depozit in
          afara Romaniei, conform informatiilor de pe site la momentul comenzii.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-[#14534d]">
        <h2 className="text-xl font-semibold text-[#042f2c]">7. Dreptul de retragere si produse sigilate</h2>
        <p>
          In masura in care legea aplicabila privind vanzarile la distanta va acorda dreptul de retragere,
          veti fi informat despre modalitate si termene. Produsele sigilate de natura sanitara/medicala pot face
          obiectul unor exceptii de la retragere dupa desigilare — detaliile trebuie aliniate la reglementarile
          UE si nationale in vigoare la data comenzii (consultati un jurist).
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
        <h2 className="text-xl font-semibold text-[#042f2c]">10. Lege aplicabila si litigii</h2>
        <p>
          Pentru aspectele comerciale se pot aplica normele UE si nationale relevante. Consumatorii din UE pot
          beneficia de mecanisme de solutionare extrajudiciara (ex. platforma ODR) acolo unde este cazul.
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
