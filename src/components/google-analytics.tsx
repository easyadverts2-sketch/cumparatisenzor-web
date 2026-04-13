"use client";

import Script from "next/script";

type Props = {
  measurementId?: string;
};

export function GoogleAnalytics({ measurementId }: Props) {
  if (!measurementId?.trim()) {
    return null;
  }
  const id = measurementId.trim();
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
