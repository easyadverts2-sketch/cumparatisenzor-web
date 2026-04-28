import Image from "next/image";
import Link from "next/link";
import { libreAppsContent, type AppsLocale } from "@/lib/libre-apps-content";

function AppLogo({ text }: { text: string }) {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6f2147] to-[#df5b42] text-sm font-bold text-white shadow-sm">
      {text}
    </div>
  );
}

function DevicePlaceholder() {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-[#0d4f4a]/10 bg-gradient-to-b from-[#f9fbfb] to-white">
      <div className="h-28 w-16 rounded-xl border-2 border-[#0d4f4a]/20 bg-white shadow-sm" />
    </div>
  );
}

function Card({
  app,
  labels,
}: {
  app: (typeof libreAppsContent)["ro"]["officialApps"][number];
  labels: { advantages: string; drawbacks: string; note: string };
}) {
  return (
    <article className="rounded-2xl border border-[#0d4f4a]/12 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AppLogo text={app.logoText} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0f766e]">{app.name}</p>
          <a
            href={app.href}
            target="_blank"
            rel="noreferrer"
            className="text-lg font-semibold text-[#8f2c53] no-underline hover:underline"
          >
            {app.title}
          </a>
        </div>
      </div>
      <p className="mt-3 text-sm text-[#1a4d47]">{app.summary}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0f766e]">{labels.advantages}</p>
          <ul className="mt-1 ml-5 list-disc text-sm text-[#1a4d47]">
            {app.advantages.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0f766e]">{labels.drawbacks}</p>
          <ul className="mt-1 ml-5 list-disc text-sm text-[#1a4d47]">
            {app.drawbacks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-sm text-[#1a4d47]">
        <span className="font-semibold">{labels.note}:</span> {app.note}
      </p>
      {app.availabilityNote ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{app.availabilityNote}</p>
      ) : null}

      <div className="mt-4">
        {app.screenshotSrc ? (
          <Image
            src={app.screenshotSrc}
            alt={app.screenshotAlt || app.title}
            width={900}
            height={520}
            className="h-40 w-full rounded-2xl border border-[#0d4f4a]/10 object-cover"
          />
        ) : (
          <DevicePlaceholder />
        )}
      </div>
    </article>
  );
}

export function LibreAppsOverviewPage({ locale }: { locale: AppsLocale }) {
  const c = libreAppsContent[locale];
  const labels =
    locale === "hu"
      ? { advantages: "Erossegek", drawbacks: "Korlatozasok", note: "Megjegyzes" }
      : { advantages: "Avantaje", drawbacks: "Limitari", note: "Nota" };
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-2xl border border-[#8f2c53]/20 bg-[#fff8fb] p-5 text-sm text-[#6d1c3f]">
        {c.topDisclaimer}
      </div>

      <section className="mt-6 rounded-3xl border border-[#0d4f4a]/10 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#042f2c]">{c.pageTitle}</h1>
        <p className="mt-3 max-w-4xl text-[#14534d]">{c.intro}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-[#042f2c]">{c.officialTitle}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {c.officialApps.map((app) => (
            <Card key={app.title} app={app} labels={labels} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[#042f2c]">{c.thirdPartyTitle}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {c.thirdPartyApps.map((app) => (
            <Card key={app.title} app={app} labels={labels} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-[#0d4f4a]/10 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#042f2c]">{c.closingTitle}</h3>
        <p className="mt-2 text-[#14534d]">{c.closingText}</p>
      </section>

      <p className="mt-6 text-sm text-[#14534d]">{c.bottomFootnote}</p>
      <div className="mt-4">
        <Link href={locale === "hu" ? "/hu" : "/"} className="text-sm text-[#8f2c53] underline">
          {locale === "hu" ? "Vissza a fooldalra" : "Inapoi la pagina principala"}
        </Link>
      </div>
    </main>
  );
}

