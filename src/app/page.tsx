import { OrderForm } from "@/components/order-form";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="pb-16">
      <section className="bg-gradient-to-b from-emerald-50 to-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              FreeStyle Libre 2 Plus - disponibil in Romania
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Monitorizare moderna a glucozei, cu mai multa libertate zi de zi
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-700">
              Solutie prietenoasa pentru comunitatea persoanelor cu diabet: comanda rapida, livrare
              in Romania si suport uman real.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#comanda"
                className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white no-underline hover:bg-emerald-800"
              >
                Comanda acum
              </Link>
              <Link
                href="/despre-libre"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 no-underline hover:border-slate-400"
              >
                Afla cum functioneaza
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-xl">
            <Image
              src="/libre-user.png"
              alt="Utilizator FreeStyle Libre 2 Plus"
              width={1100}
              height={760}
              className="h-auto w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="grid gap-4 md:grid-cols-2">
          <p className="rounded-xl border border-emerald-200 bg-white p-4 text-slate-700 shadow-sm">
            Alarme optionale pentru valori prea mari sau prea mici.
          </p>
          <p className="rounded-xl border border-emerald-200 bg-white p-4 text-slate-700 shadow-sm">
            Citire rapida cu telefon compatibil sau cititor dedicat.
          </p>
          <p className="rounded-xl border border-emerald-200 bg-white p-4 text-slate-700 shadow-sm">
            Tendinte si istoric usor de urmarit in aplicatie.
          </p>
          <p className="rounded-xl border border-emerald-200 bg-white p-4 text-slate-700 shadow-sm">
            Confort zilnic, fara intepaturi repetate in degete.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl rounded-2xl bg-white px-6 py-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Cum cumperi in 4 pasi</h2>
        <ol className="mt-5 grid gap-3 text-slate-700 md:grid-cols-2">
          <li className="rounded-lg border border-slate-200 p-4">
            1. Alegi cantitatea de senzori FreeStyle Libre 2 Plus.
          </li>
          <li className="rounded-lg border border-slate-200 p-4">
            2. Completezi datele de facturare si livrare.
          </li>
          <li className="rounded-lg border border-slate-200 p-4">
            3. Selectezi plata ramburs sau transfer bancar.
          </li>
          <li className="rounded-lg border border-slate-200 p-4">
            4. Primesti coletul in 3-5 zile lucratoare din depozitul nostru din Polonia.
          </li>
        </ol>
      </section>

      <section id="comanda" className="mx-auto mt-12 max-w-6xl rounded-2xl bg-white px-6 py-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Comanda acum</h2>
            <p className="mt-2 text-slate-700">
              Pret: 350 RON / pachet, SKU 5021791006694. Livrare 10 RON, gratuita de la 4 bucati.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Image
                src="/libre-product.png"
                alt="Produs FreeStyle Libre 2 Plus"
                width={1000}
                height={760}
                className="h-auto w-full rounded-lg object-cover"
              />
            </div>
          </div>
          <OrderForm />
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl rounded-2xl bg-white px-6 py-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Suport clienti</h2>
        <p className="mt-3 text-slate-700">
          Oferim suport telefonic in ceha, poloneza, engleza, germana, rusa si croata. Pentru
          clienti care vorbesc doar romana, contactul initial se face prin e-mail.
        </p>
        <p className="mt-2 text-slate-700">
          Produsul livrat nu include limba romana in pachet. Pentru utilizare, consultati
          instructiunile online din pagina despre produs.
        </p>
      </section>
    </main>
  );
}
