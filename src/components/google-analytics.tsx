"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  parseCookieConsent,
} from "@/lib/cookie-consent";

type Props = {
  measurementId?: string;
};

export function GoogleAnalytics({ measurementId }: Props) {
  const id = measurementId?.trim() || "";
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!id) return;
    const refresh = () => {
      const consent = parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
      const allowed = Boolean(consent?.analytics);
      setEnabled(allowed);
      // Official GA disable switch.
      (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = !allowed;
    };
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(COOKIE_CONSENT_EVENT, onUpdate as EventListener);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, onUpdate as EventListener);
      window.removeEventListener("storage", onUpdate);
    };
  }, [id]);

  if (!id || !enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
