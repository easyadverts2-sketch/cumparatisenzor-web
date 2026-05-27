import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "sensorglukoz.eu — FreeStyle Libre 2 Plus",
  description:
    "FreeStyle Libre 2 Plus для русскоязычных клиентов в Германии, Польше и Австрии. Доставка PPL, DPD, Fineship.",
  alternates: { canonical: "/eu" },
};

export default function EuHomePage() {
  return (
    <main className="pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6f2147] via-[#b23962] to-[#ee7a32] text-white">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              FreeStyle Libre 2 Plus — доставка в DE, PL, AT
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Непрерывный мониторинг глюкозы для повседневной жизни
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Простой заказ на русском языке, понятная поддержка и надёжная доставка в Германию, Польшу и Австрию.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/eu/comanda"
                className="rounded-xl bg-white px-6 py-3.5 font-semibold text-[#8f2c53] shadow-lg no-underline hover:bg-[#fff1e6]"
              >
                Оформить заказ
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <Image
              src="/libre-user.png"
              alt="FreeStyle Libre"
              width={1100}
              height={760}
              className="h-auto w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-12 max-w-6xl px-6">
        <div className="rounded-3xl border-2 border-[#de6a44]/25 bg-white p-8 shadow-xl md:p-10">
          <h2 className="text-2xl font-bold text-[#042f2c] md:text-3xl">Что такое FreeStyle Libre 2 Plus?</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
            FreeStyle Libre 2 Plus — система непрерывного мониторинга глюкозы (CGM): небольшой сенсор на руке
            отслеживает показатели до <strong className="text-[#042f2c]">15 дней</strong>, данные видны в телефоне
            или считывателе.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#14534d]">
            Система помогает лучше понимать изменения глюкозы в течение дня, с меньшим количеством проколов и более
            понятными трендами.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: "🔔", title: "Оповещения", text: "Настраиваемые сигналы при высоких и низких значениях." },
              { icon: "📱", title: "Быстрое считывание", text: "Данные на телефоне или считывателе." },
              { icon: "📈", title: "Тренды в приложении", text: "Графики и история за день." },
              { icon: "🩹", title: "Меньше проколов", text: "Удобнее в повседневной рутине." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#de6a44]/30 bg-gradient-to-br from-[#fff4ec] to-white p-5 shadow-sm"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f8d9c4] text-lg">
                  {item.icon}
                </span>
                <h3 className="mt-3 font-semibold text-[#042f2c]">{item.title}</h3>
                <p className="mt-2 text-[#14534d]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6 text-center">
        <Link
          href="/eu/comanda"
          className="inline-block rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-8 py-4 text-lg font-semibold text-white no-underline shadow-lg hover:from-[#0f766e] hover:to-[#115e59]"
        >
          Заказать сенсор — 60 €
        </Link>
      </section>
    </main>
  );
}
