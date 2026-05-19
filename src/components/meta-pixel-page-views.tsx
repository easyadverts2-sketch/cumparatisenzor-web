"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * App Router does not full-reload on navigation; emit PageView on route changes
 * (Meta Pixel base snippet only tracks the initial load).
 */
export function MetaPixelPageViews() {
  const pathname = usePathname();
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const pathWithQuery = `${pathname || ""}${search}`;
    if (lastSentRef.current === pathWithQuery) return;
    const isFirst = lastSentRef.current === null;
    lastSentRef.current = pathWithQuery;
    if (isFirst) return;

    const fbq = window.fbq;
    if (typeof fbq !== "function") return;
    fbq("track", "PageView");
  }, [pathname]);

  return null;
}
