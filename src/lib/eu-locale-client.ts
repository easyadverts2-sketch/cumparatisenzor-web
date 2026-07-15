"use client";

import { usePathname } from "next/navigation";

/**
 * Client-side locale detection for the /eu tree. Deliberately not driven by
 * a server-computed prop: /eu and /eu/ua share one layout, and Next's router
 * cache can reuse that layout's last server render across client-side
 * navigations between the two, leaving any server-computed "locale" prop
 * stuck on whichever language was current when the layout was last actually
 * re-rendered from the server. usePathname() always reflects the live URL.
 */
export function useEuLocale(): "ru" | "uk" {
  const pathname = usePathname() || "/eu";
  return pathname === "/eu/ua" || pathname.startsWith("/eu/ua/") ? "uk" : "ru";
}
