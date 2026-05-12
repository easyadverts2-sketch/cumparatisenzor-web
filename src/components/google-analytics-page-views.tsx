"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  measurementId?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * GA4 initial config (in GoogleAnalytics) sends one page_view on full page load.
 * Next.js App Router navigations do not reload the page, so we must emit page_view
 * on route changes for "Page path / title" reports to populate.
 */
export function GoogleAnalyticsPageViews({ measurementId }: Props) {
  const id = measurementId?.trim() || "";
  const pathname = usePathname();
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    const pathWithQuery = `${pathname || ""}${search}`;
    if (lastSentRef.current === pathWithQuery) return;
    const isFirst = lastSentRef.current === null;
    lastSentRef.current = pathWithQuery;
    if (isFirst) return;

    const g = window.gtag;
    if (typeof g !== "function") return;

    g("event", "page_view", {
      page_path: pathWithQuery,
      page_title: typeof document !== "undefined" ? document.title : undefined,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [id, pathname]);

  return null;
}
