import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rolunk",
  description: "Kozossegi alapu csapat, amely FreeStyle Libre 2 Plus szenzorokat szallit Magyarorszagra.",
  alternates: { canonical: "/hu/rolunk" },
};

export default function HuAboutUsPage() {
  const resources = [
    {
      title: "Szurikata Alapitvany - Libre gyorstalpalo",
      url: "https://szurikataalapitvany.hu/technikai-eszkozok-ujdonsagok/freestyle-libre-gyorstalpalo-kezdoknek/?utm_source=chatgpt.com",
      desc: "Gyakorlati alapok a Libre hasznalatahoz kezdoknek, kozossegi tapasztalatokkal.",
    },
    {
      title: "Magyar Diabetes Tarsasag",
      url: "https://www.diabetes.hu/",
      desc: "Szakmai anyagok, iranyelvek es megbizhato informaciok cukorbetegeknek.",
    },
    {
      title: "DiabForum",
      url: "https://www.diabforum.hu/",
      desc: "Kozertheto cikkek, mindennapi eletmod tippek es gyakorlati tanacsok diabetezhez.",
    },
    {
      title: "Webbeteg - cukorbetegseg temaoldal",
      url: "https://www.webbeteg.hu/cimke/cukorbetegseg",
      desc: "Attekintheto betegedukacios tartalom eletmodrol, kontrollrol es kezelesrol.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff4ec] to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-[#be3f6f]">Rolunk</p>
        <h1 className="mt-2 text-4xl font-bold text-[#042f2c]">Kozossegbol, kozossegnek</h1>
        <p className="mt-6 text-xl leading-relaxed text-[#14534d]">
          Olyan csapat vagyunk, amely ismeri a cukorbetegseggel elo emberek mindennapi kihivasait.
          Celunk, hogy a FreeStyle Libre 2 Plus szenzorok elerhetoek legyenek Magyarorszagon is.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#de6a44]/30 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#042f2c]">Kuldetesunk</h2>
            <p className="mt-3 text-[#14534d]">
              Megbizhato rendelest, atlathato arakat es egyertelmu kommunikaciot adni magyar nyelven.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#de6a44]/30 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#042f2c]">Jogi uzemelteto</h2>
            <p className="mt-3 text-[#14534d]">
              <strong className="text-[#042f2c]">Ceska maloobchodni s.r.o.</strong>
              <br />
              Braunerova 563/7, Liben (Praha 8), 180 00 Praha
              <br />
              ID: 23504463
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border-2 border-[#a6445f]/15 bg-[#fff4ec] p-8">
          <h2 className="text-xl font-bold text-[#042f2c]">Hasznos magyar nyelvu diabetesz forrasok</h2>
          <p className="mt-3 text-[#14534d]">
            Osszegyujtottunk 4 hasznos oldalt, amelyek segitenek a mindennapi diabetes menedzsmentben.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {resources.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#de6a44]/25 bg-white p-4 no-underline shadow-sm transition hover:border-[#be3f6f]/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.url)}`}
                    alt=""
                    width={32}
                    height={32}
                    className="mt-0.5 h-8 w-8 rounded"
                  />
                  <div>
                    <h3 className="font-semibold text-[#3a1d2d]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#5c3046]">{item.desc}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center">
          <Link href="/hu/comanda" className="inline-flex rounded-xl bg-[#be3f6f] px-8 py-3 font-semibold text-white no-underline hover:bg-[#9d2f56]">
            Rendeles
          </Link>
        </p>
      </div>
    </main>
  );
}
