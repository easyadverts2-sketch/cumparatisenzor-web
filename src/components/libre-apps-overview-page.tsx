import Image from "next/image";
import Link from "next/link";
import { libreAppsContent, type AppsLocale } from "@/lib/libre-apps-content";

function AppLogo({ text, src, alt }: { text: string; src?: string; alt: string }) {
  if (src) {
    return (
      <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[#0d4f4a]/10 bg-white shadow-sm">
        <Image src={src} alt={alt} width={48} height={48} className="h-full w-full object-contain p-1" />
      </div>
    );
  }
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
    <article className="flex h-full flex-col rounded-2xl border border-[#0d4f4a]/12 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <AppLogo text={app.logoText} src={app.logoSrc} alt={`${app.title} logo`} />
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
      <p className="mt-3 text-sm leading-relaxed text-[#1a4d47]">{app.summary}</p>

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

      <p className="mt-3 text-sm leading-relaxed text-[#1a4d47]">
        <span className="font-semibold">{labels.note}:</span> {app.note}
      </p>
      {app.availabilityNote ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{app.availabilityNote}</p>
      ) : null}

      <div className="mt-4 mt-auto">
        {app.screenshotSrc ? (
          <div className="overflow-hidden rounded-2xl border border-[#0d4f4a]/10 bg-[#f3f8f8]">
            <Image
              src={app.screenshotSrc}
              alt={app.screenshotAlt || app.title}
              width={1200}
              height={675}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-[#0d4f4a]/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-[#6d1c3f]">{c.topDisclaimer}</p>
        <h1 className="text-3xl font-bold text-[#042f2c]">{c.pageTitle}</h1>
        <p className="mt-3 max-w-4xl leading-relaxed text-[#14534d]">{c.intro}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight text-[#042f2c]">{c.officialTitle}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {c.officialApps.map((app) => (
            <Card key={app.title} app={app} labels={labels} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-[#042f2c]">{c.thirdPartyTitle}</h2>
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

