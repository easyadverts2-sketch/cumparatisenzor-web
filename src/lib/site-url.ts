export type SiteVariant = "ro" | "hu" | "eu";

/** Canonical production origin for kupitsensor.eu (Search Console uses www). */
export const EU_SITE_ORIGIN = "https://www.kupitsensor.eu";

/** Absolute public URL on kupitsensor.eu (always www in production). */
export function euSiteUrl(path = "/"): string {
  if (!path || path === "/") return EU_SITE_ORIGIN;
  return `${EU_SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

const DOMAIN_BY_VARIANT: Record<SiteVariant, string> = {
  ro: "https://cumparatisenzor.ro",
  hu: "https://szenzorvasarlas.hu",
  eu: EU_SITE_ORIGIN,
};

/**
 * Market for the current request, from the `x-site-variant` header the
 * middleware sets based on hostname. Used only by routes that must serve
 * different output per custom domain (robots.txt, sitemap.xml) — page
 * metadata should keep using the per-market constants already in each
 * locale's layout/page instead of calling this.
 */
export function getRequestSiteVariant(requestHeaders: { get(name: string): string | null }): SiteVariant {
  const variant = requestHeaders.get("x-site-variant");
  if (variant === "hu" || variant === "eu") return variant;
  return "ro";
}

/** Public domain for a given market — mirrors the hostnames in middleware.ts. */
export function getPublicSiteUrlForVariant(variant: SiteVariant) {
  if (variant === "ro") {
    // Preserve existing override/preview behavior for the default market.
    return getPublicSiteUrl();
  }
  return DOMAIN_BY_VARIANT[variant];
}

/** URL public al site-ului (pentru Stripe redirect, link-uri, SEO). */
export function getPublicSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  // In productie preferam mereu domeniul principal, altfel Search Console
  // poate vedea URL-uri de preview (*.vercel.app) in sitemap.
  if (process.env.VERCEL_ENV === "production") {
    return "https://cumparatisenzor.ro";
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "https://cumparatisenzor.ro";
}

/** Bază pentru metadata Next.js (canonical, Open Graph). */
export function getMetadataBase(): URL {
  const base = getPublicSiteUrl();
  return new URL(base.endsWith("/") ? base : `${base}/`);
}
