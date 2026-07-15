"use client";

import { useEffect } from "react";
import { useEuLocale } from "@/lib/eu-locale-client";

/**
 * <html lang> can only be set by the root layout, a Server Component whose
 * render can be reused by the router cache across /eu <-> /eu/ua client-side
 * navigations (same failure mode as the header/footer). Correct it after
 * the fact on the client so screen readers and browser translate prompts
 * stay accurate even when the server didn't re-render.
 */
export function EuHtmlLangSync() {
  const locale = useEuLocale();

  useEffect(() => {
    document.documentElement.lang = locale === "uk" ? "uk" : "ru";
  }, [locale]);

  return null;
}
