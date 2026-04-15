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
