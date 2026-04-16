import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASZF",
  description: "Altalanos szerzodesi feltetelek a szenzorvasarlas.hu oldalhoz.",
  alternates: { canonical: "/hu/aszf" },
};

export default function HuAszfPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold text-[#042f2c]">Altalanos Szerzodesi Feltetelek</h1>
      <p className="mt-4 text-[#14534d]">
        Tajekoztato jellegu tartalom. Jogi veglegesiteshez magyar fogyasztovedelmi szakjogasz bevonasa javasolt.
      </p>
      <div className="mt-10 space-y-5 text-[#14534d]">
        <p><strong>Uzemelteto:</strong> Ceska maloobchodni s.r.o., Praha, ID 23504463.</p>
        <p><strong>Penznem:</strong> HUF. Az arak es szallitasi dijak a rendeles veglegesitese elott lathatok.</p>
        <p><strong>Fizetes:</strong> utanvet vagy banki atutalas.</p>
        <p><strong>Szallitas:</strong> futarszolgalattal a megadott magyarorszagi cimre.</p>
        <p><strong>Elallas / reklamacio:</strong> az alkalmazando EU es magyar jogszabalyok szerint.</p>
      </div>
    </main>
  );
}
