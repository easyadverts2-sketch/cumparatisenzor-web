export default function DespreLibrePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Despre FreeStyle Libre 2 Plus</h1>
      <p className="mt-4 text-slate-700">
        FreeStyle Libre 2 Plus este un sistem de monitorizare continua a glucozei (CGM), cu
        senzori purtati pe brat si posibilitate de alerte pentru valori ridicate sau scazute.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
        <li>Monitorizare usoara pe parcursul intregii zile.</li>
        <li>Vizualizare tendinte ale glucozei in timp.</li>
        <li>Ajuta la decizii mai rapide privind rutina zilnica.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Video explicativ</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-black">
        <iframe
          width="100%"
          height="460"
          src="https://www.youtube.com/embed/XO8JGUsXX_E"
          title="FreeStyle Libre 2 Plus"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Instructiuni produs (PDF)</h2>
      <p className="mt-2 text-slate-700">
        Descarca ghidul oficial:
        {" "}
        <a href="https://www.freestyle.abbott/content/dam/adc/freestyle/ie/documents/legacy/ADC-54128_RUM_WEB_Foreign_Language_LP_Digital_(1).pdf">
          leaflet FreeStyle Libre 2 Plus
        </a>
      </p>
    </main>
  );
}
