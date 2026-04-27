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
      <h1 className="text-4xl font-bold text-[#042f2c]">Politica de confidentialitate (GDPR)</h1>
      <p className="mt-4 text-[#14534d]">
        Acest document descrie modul in care prelucram datele personale conform Regulamentului (UE) 2016/679
        (GDPR) si legislatiei aplicabile din Republica Ceha.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-[#042f2c]">Operator</h2>
      <p className="mt-2 text-[#14534d]">
        Česká maloobchodní s.r.o., Braunerova 563/7, Libeň (Praha 8), 180 00 Praha, ID 23504463.
      </p>
      <p className="mt-2 text-[#14534d]">
        Pentru solicitari privind datele personale (acces, stergere, opozitie, corectare), ne puteti contacta prin
        formularul public de pe site: <strong>/kontakt</strong>.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Date colectate</h2>
      <p className="mt-2 text-[#14534d]">
        Colectam: nume, adresa de facturare/livrare, e-mail, telefon, continutul comenzii, date despre plata
        (fara a stoca date complete de card pe serverul nostru), istoricul comunicarii si date tehnice minime
        necesare functionarii site-ului.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Scopurile prelucrarii</h2>
      <p className="mt-2 text-[#14534d]">
        Prelucram datele pentru: (1) procesarea comenzii si emiterea documentelor fiscale, (2) organizarea livrarii
        prin curier, (3) solutionarea reclamatiilor, retururilor si rambursarilor, (4) prevenirea fraudelor si
        securitatea platformei, (5) comunicari comerciale doar unde exista baza legala.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Temei legal</h2>
      <p className="mt-2 text-[#14534d]">
        Executarea contractului (art. 6 alin. 1 lit. b GDPR), obligatii legale (art. 6 alin. 1 lit. c),
        interes legitim (art. 6 alin. 1 lit. f) pentru securitate/prevenirea fraudelor si, unde este cazul,
        consimtamant (art. 6 alin. 1 lit. a) pentru comunicari de marketing.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Destinatari si imputerniciti</h2>
      <p className="mt-2 text-[#14534d]">
        Datele pot fi partajate cu firme de curierat, procesatori de plati, furnizori IT/hosting,
        furnizori de e-mail si, cand legea o impune, autoritati publice.
      </p>
      <p className="mt-2 text-[#14534d]">
        Partajam doar datele strict necesare pentru executarea serviciului (ex: nume, telefon, adresa pentru livrare;
        identificatori de plata la procesatorul de plata).
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Perioada de stocare</h2>
      <p className="mt-2 text-[#14534d]">
        Datele de comanda/facturare sunt pastrate pe durata impusa de obligatiile fiscale si contabile.
        Datele folosite pentru comunicari comerciale se pastreaza pana la retragerea consimtamantului
        sau pana la expirarea perioadelor legale aplicabile.
      </p>
      <p className="mt-2 text-[#14534d]">
        Datele aferente solicitarilor de retur/reclamatie sunt pastrate pe durata necesara solutionarii si pentru
        apararea eventualelor drepturi legale, conform termenelor aplicabile.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Transferuri internationale</h2>
      <p className="mt-2 text-[#14534d]">
        Daca datele sunt transferate in afara SEE prin furnizori terti, transferul se face numai cu garantii
        adecvate (de exemplu clauze contractuale standard).
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Drepturile dumneavoastra</h2>
      <p className="mt-2 text-[#14534d]">
        Puteti solicita acces, rectificare, stergere, restrictionarea prelucrarii, portabilitatea si puteti
        depune plangere la autoritatea de supraveghere competenta.
      </p>
      <p className="mt-2 text-[#14534d]">
        Pentru solicitari, va putem cere date minime de verificare a identitatii pentru a preveni accesul neautorizat
        la date personale.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-[#042f2c]">Autoritate de supraveghere</h2>
      <p className="mt-2 text-[#14534d]">
        In Republica Ceha: UOOU (Uřad pro ochranu osobních údajů) - https://www.uoou.cz.
      </p>
    </main>
  );
}
