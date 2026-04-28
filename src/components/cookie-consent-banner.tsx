"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  defaultCookieConsent,
  parseCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

type Props = {
  locale: "ro" | "hu";
};

type Draft = {
  analytics: boolean;
  marketing: boolean;
};

function persistConsent(consent: CookieConsent) {
  const raw = JSON.stringify(consent);
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, raw);
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(raw)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
}

export function CookieConsentBanner({ locale }: Props) {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<Draft>({ analytics: false, marketing: false });

  useEffect(() => {
    const existing = parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
    if (!existing) {
      setVisible(true);
      return;
    }
    setDraft({ analytics: existing.analytics, marketing: existing.marketing });
    setVisible(false);
  }, []);

  const t = useMemo(() => {
    if (locale === "hu") {
      return {
        title: "Cookie-beallitasok",
        text:
          "A weboldal mukodesehez szukseges cookie-kat mindig hasznaljuk. Az analitikai es marketing cookie-kat csak az on hozzajarulasaval aktiváljuk.",
        reject: "Osszes elutasitasa",
        accept: "Osszes elfogadasa",
        customize: "Beallitasok",
        save: "Kivalasztottak mentese",
        necessary: "Szukseges cookie-k (mindig aktiv)",
        analytics: "Analitikai cookie-k",
        marketing: "Marketing cookie-k",
        policy: "Adatkezelesi tajekoztato",
        manage: "Cookie-beallitasok",
      };
    }
    return {
      title: "Setari cookies",
      text:
        "Folosim cookie-uri strict necesare pentru functionarea site-ului. Cookie-urile analitice si de marketing sunt activate doar cu acordul dumneavoastra.",
      reject: "Refuza tot",
      accept: "Accepta tot",
      customize: "Personalizeaza",
      save: "Salveaza selectia",
      necessary: "Cookie-uri necesare (mereu active)",
      analytics: "Cookie-uri analitice",
      marketing: "Cookie-uri de marketing",
      policy: "Politica de confidentialitate",
      manage: "Setari cookies",
    };
  }, [locale]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#0d4f4a]/15 bg-white/98 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-base font-semibold text-[#0a2624]">{t.title}</h2>
        <p className="mt-1 text-sm text-[#1a4d47]">{t.text}</p>

        {customizing ? (
          <div className="mt-3 grid gap-2 text-sm text-[#1a4d47]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>{t.necessary}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(e) => setDraft((prev) => ({ ...prev, analytics: e.target.checked }))}
              />
              <span>{t.analytics}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.marketing}
                onChange={(e) => setDraft((prev) => ({ ...prev, marketing: e.target.checked }))}
              />
              <span>{t.marketing}</span>
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border border-[#8f2c53]/30 bg-white px-3 py-2 text-sm font-medium text-[#8f2c53] hover:bg-[#fff4f8]"
            onClick={() => {
              persistConsent({
                necessary: true,
                analytics: false,
                marketing: false,
                updatedAt: new Date().toISOString(),
              });
              setVisible(false);
            }}
          >
            {t.reject}
          </button>
          <button
            className="rounded-lg bg-[#0d9488] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
            onClick={() => {
              const consent = defaultCookieConsent();
              consent.analytics = true;
              consent.marketing = true;
              persistConsent(consent);
              setVisible(false);
            }}
          >
            {t.accept}
          </button>
          {!customizing ? (
            <button
              className="rounded-lg border border-[#0d4f4a]/25 bg-white px-3 py-2 text-sm font-medium text-[#0a2624] hover:bg-[#f0faf8]"
              onClick={() => setCustomizing(true)}
            >
              {t.customize}
            </button>
          ) : (
            <button
              className="rounded-lg border border-[#0d4f4a]/25 bg-white px-3 py-2 text-sm font-medium text-[#0a2624] hover:bg-[#f0faf8]"
              onClick={() => {
                persistConsent({
                  necessary: true,
                  analytics: draft.analytics,
                  marketing: draft.marketing,
                  updatedAt: new Date().toISOString(),
                });
                setVisible(false);
              }}
            >
              {t.save}
            </button>
          )}
          <Link
            href={locale === "hu" ? "/hu/adatkezeles" : "/gdpr"}
            className="ml-auto text-sm text-[#8f2c53] underline"
          >
            {t.policy}
          </Link>
        </div>
      </div>
    </div>
  );
}

