/** URL public al site-ului (pentru Stripe redirect, link-uri, SEO). */
export function getPublicSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

/** Bază pentru metadata Next.js (canonical, Open Graph). */
export function getMetadataBase(): URL {
  const base = getPublicSiteUrl();
  return new URL(base.endsWith("/") ? base : `${base}/`);
}
