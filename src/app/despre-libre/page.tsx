export default function DespreLibrePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">Despre FreeStyle Libre 2 Plus</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
        FreeStyle Libre 2 Plus este un sistem de monitorizare continua a glucozei (CGM): purtati un senzor pe
        brat si puteti vedea valorile pe telefon (compatibil) sau pe cititorul dedicat. Senzorul poate fi purtat
        pana la aproximativ <strong className="text-[#042f2c]">15 zile</strong>, oferind o imagine mai clara a
        evolutiei glicemiei decat masuratorile ocazionale in deget.
      </p>
      <ul className="mt-6 space-y-2 text-[#14534d]">
        <li className="flex gap-2">
          <span className="text-[#0d9488]">•</span>
          Monitorizare pe parcursul zilei, cu tendinte si istoric in aplicatie.
        </li>
        <li className="flex gap-2">
          <span className="text-[#0d9488]">•</span>
          Alerte optionale pentru valori prea mari sau prea mici (conform setarilor).
        </li>
        <li className="flex gap-2">
          <span className="text-[#0d9488]">•</span>
          Consultati mereu medicul pentru interpretarea datelor si tratament.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl font-semibold text-[#042f2c]">Video explicativ</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#0d9488]/25 bg-black shadow-lg">
        <iframe
          width="100%"
          height="460"
          src="https://www.youtube.com/embed/XO8JGUsXX_E"
          title="FreeStyle Libre 2 Plus"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-[#042f2c]">Instructiuni produs (PDF)</h2>
      <p className="mt-2 text-[#14534d]">
        Descarcati ghidul oficial:{" "}
        <a
          href="https://www.freestyle.abbott/content/dam/adc/freestyle/ie/documents/legacy/ADC-54128_RUM_WEB_Foreign_Language_LP_Digital_(1).pdf"
          className="font-semibold text-[#0f766e] underline"
        >
          leaflet FreeStyle Libre 2 Plus (PDF)
        </a>
      </p>
    </main>
  );
}
