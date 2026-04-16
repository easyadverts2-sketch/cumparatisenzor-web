import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FreeStyle Libre 2 Plus - ismerteto",
  description: "Mit erdemes tudni a FreeStyle Libre 2 Plus CGM rendszerrol Magyarorszagon.",
  alternates: { canonical: "/hu/despre-libre" },
};

export default function HuAboutLibrePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">FreeStyle Libre 2 Plus ismerteto</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
        A FreeStyle Libre 2 Plus egy folyamatos glukozmonitorozasi (CGM) rendszer. A szenzor a karon
        viselheto, az ertekek pedig telefonon vagy dedikalt olvason kovethetok.
      </p>
      <ul className="mt-6 space-y-2 text-[#14534d]">
        <li className="flex gap-2"><span className="text-[#0d9488]">•</span>Akár 15 napos szenzorhasznalat.</li>
        <li className="flex gap-2"><span className="text-[#0d9488]">•</span>Trendek es elozmenyek alkalmazasban.</li>
        <li className="flex gap-2"><span className="text-[#0d9488]">•</span>Riasztasok magas vagy alacsony ertekekre.</li>
      </ul>
      <div className="mt-8 rounded-2xl border border-[#de6a44]/25 bg-[#fff4ec] p-5">
        <h2 className="text-lg font-semibold text-[#3a1d2d]">LibreLink letoltes</h2>
        <p className="mt-2 text-[#5c3046]">Magyarorszagon az alkalmazas hivatalosan letoltheto:</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="https://play.google.com/store/apps/details?id=com.freestylelibre.app.hu" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#be3f6f] underline">
            Google Play
          </a>
          <a href="https://apps.apple.com/hu/app/freestyle-librelink-hu/id1472262800" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#be3f6f] underline">
            App Store
          </a>
        </div>
      </div>
    </main>
  );
}
