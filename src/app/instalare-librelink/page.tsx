import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo-config";
import { getPublicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Instalare LibreLink pe Android si iOS",
  description:
    "Ghid practic pentru instalarea aplicatiei FreeStyle LibreLink in Romania pe iOS si Android.",
  alternates: { canonical: "/instalare-librelink" },
  openGraph: {
    url: `${getPublicSiteUrl()}/instalare-librelink`,
    title: `Instalare LibreLink | ${SITE_NAME}`,
    description: "Pasii esentiali pentru instalare, schimbarea regiunii si revenirea la setarile initiale.",
  },
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl border border-[#de6a44]/30 bg-white p-4 text-[#5c3046] shadow-sm">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#be3f6f] text-sm font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function InstalareLibrelinkPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/despre-libre" className="text-sm font-medium text-[#be3f6f] hover:underline">
        ← Inapoi la Despre Libre
      </Link>

      <div className="mt-4 rounded-3xl border-2 border-[#de6a44]/25 bg-gradient-to-b from-[#fff4ec] to-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#3a1d2d]">Instalare LibreLink in Romania (Android + iOS)</h1>
        <p className="mt-3 text-[#5c3046]">
          In unele situatii, aplicatia poate sa nu apara direct in store-ul local. Urmati pasii de mai jos
          pentru instalare, apoi reveniti la setarile initiale ale contului.
        </p>
        <p className="mt-2 text-sm text-[#7a3f54]">
          Nota: disponibilitatea aplicatiei poate varia in timp. Verificati intotdeauna si sursele oficiale Abbott.
        </p>
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#de6a44]/25 bg-[#fff4ec] p-6">
          <h2 className="text-xl font-semibold text-[#3a1d2d]">Apple iOS</h2>
          <ol className="mt-4 space-y-3">
            <Step n={1}>Intrati in <strong>Setari</strong> → <strong>Apple ID</strong> → <strong>Tara/Regiune</strong>.</Step>
            <Step n={2}>Alegeti o tara unde aplicatia este disponibila (de ex. Germania) si confirmati schimbarea.</Step>
            <Step n={3}>Deschideti App Store, cautati aplicatia FreeStyle Libre si instalati-o.</Step>
            <Step n={4}>Dupa instalare, reveniti in Setari si readuceti tara/regiunea la Romania.</Step>
            <Step n={5}>Porniti aplicatia, acordati permisiunile si verificati unitatile de masura (mg/dL sau mmol/L).</Step>
          </ol>
        </div>

        <div className="rounded-2xl border border-[#de6a44]/25 bg-[#fff4ec] p-6">
          <h2 className="text-xl font-semibold text-[#3a1d2d]">Android</h2>
          <ol className="mt-4 space-y-3">
            <Step n={1}>Intrati in contul Google Play si verificati setarea de tara/profil de plati.</Step>
            <Step n={2}>Daca aplicatia nu este disponibila, schimbati profilul de tara catre unul suportat.</Step>
            <Step n={3}>Deschideti Google Play, cautati FreeStyle Libre si instalati aplicatia.</Step>
            <Step n={4}>Dupa instalare, puteti reveni la setarile initiale ale contului pentru Romania.</Step>
            <Step n={5}>Deschideti aplicatia, configurati contul si validati setarile de notificari/alarme.</Step>
          </ol>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#de6a44]/25 bg-white p-6">
        <h3 className="text-lg font-semibold text-[#3a1d2d]">Ghid vizual iOS (pas cu pas)</h3>
        <p className="mt-2 text-sm text-[#5c3046]">
          Imagine orientativa pentru schimbarea regiunii in App Store si instalarea aplicatiei.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#de6a44]/25 bg-[#fff4ec] p-2">
          <Image
            src="/librelink-ios-guide.png"
            alt="Ghid vizual iOS pentru instalarea aplicatiei LibreLink"
            width={683}
            height={1024}
            className="h-auto w-full rounded-lg object-contain"
            priority
          />
        </div>
        <p className="mt-3 text-xs text-[#7a3f54]">
          Nota importanta: in captura apare denumirea „FreeStyle Libre 3”. Fluxul de schimbare a regiunii este
          relevant ca principiu, dar denumirea exacta a aplicatiei poate diferi in functie de versiune/disponibilitate.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-[#de6a44]/25 bg-white p-6">
        <h3 className="text-lg font-semibold text-[#3a1d2d]">Sfaturi utile</h3>
        <ul className="mt-3 space-y-2 text-[#5c3046]">
          <li>• Faceti capturi de ecran la pasii importanti (regiune, setari aplicatie, unitati).</li>
          <li>• Nu impartasiti datele de login ale contului Apple/Google.</li>
          <li>• Daca intampinati erori, reporniti telefonul si verificati din nou Store-ul.</li>
        </ul>
      </section>
    </main>
  );
}
