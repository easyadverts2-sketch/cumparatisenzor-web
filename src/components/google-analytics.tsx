"use client";

import Script from "next/script";

type Props = {
  measurementId?: string;
};

/**
 * GA4 page-view measurement is loaded whenever NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * It is not gated on optional cookie consent (aggregate traffic is treated as strictly necessary
 * for site operation). Marketing / Ads tagging remains consent-driven elsewhere.
 */
export function GoogleAnalytics({ measurementId }: Props) {
  const id = measurementId?.trim() || "";
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
