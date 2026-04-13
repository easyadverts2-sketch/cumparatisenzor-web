export default function TermeniPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Termeni si conditii</h1>
      <p className="mt-4 text-slate-700">
        Acest document reprezinta un model initial pentru lansare MVP si trebuie revizuit de
        consultant juridic inainte de productie finala.
      </p>
      <h2 className="mt-8 text-xl font-semibold">1. Operator</h2>
      <p className="mt-2 text-slate-700">
        Magazinul este operat de Česká maloobchodní s.r.o., Braunerova 563/7, Libeň (Praha 8),
        180 00 Praha, ID 23504463.
      </p>
      <h2 className="mt-8 text-xl font-semibold">2. Produse si preturi</h2>
      <p className="mt-2 text-slate-700">
        Produsul principal este FreeStyle Libre 2 Plus. Preturile sunt exprimate in RON.
      </p>
      <h2 className="mt-8 text-xl font-semibold">3. Plata si livrare</h2>
      <p className="mt-2 text-slate-700">
        Metode de plata: ramburs si transfer bancar. Livrarea standard este 10 RON, gratuita de la
        4 senzori. Expedierea se face din Polonia, cu termen estimat 3-5 zile lucratoare.
      </p>
      <h2 className="mt-8 text-xl font-semibold">4. Stoc si anulare</h2>
      <p className="mt-2 text-slate-700">
        Comenzile pot fi anulate in caz de stoc insuficient. Pentru transfer bancar, comanda poate
        fi anulata automat dupa 5 zile daca plata nu este confirmata.
      </p>
    </main>
  );
}
