export default function GdprPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Politica GDPR</h1>
      <p className="mt-4 text-slate-700">
        Acesta este un text initial GDPR pentru MVP si trebuie verificat juridic inainte de
        publicare finala.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Date colectate</h2>
      <p className="mt-2 text-slate-700">
        Colectam nume, adresa, e-mail, telefon si detalii de comanda strict pentru procesarea si
        livrarea comenzilor.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Temei legal</h2>
      <p className="mt-2 text-slate-700">
        Prelucrarea datelor este necesara pentru executarea contractului de vanzare si respectarea
        obligatiilor legale.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Drepturile clientului</h2>
      <p className="mt-2 text-slate-700">
        Clientii pot solicita acces, rectificare, stergere, restrictionare sau portabilitate a
        datelor prin e-mail.
      </p>
    </main>
  );
}
