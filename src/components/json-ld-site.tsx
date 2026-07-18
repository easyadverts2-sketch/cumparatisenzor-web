import { EU_SITE_ORIGIN, getPublicSiteUrl } from "@/lib/site-url";
import { SEO_DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "@/lib/seo-config";

type SiteVariant = "ro" | "hu" | "eu";

const VARIANT_CONFIG: Record<SiteVariant, { url: string; name: string; email: string }> = {
  ro: { url: "https://cumparatisenzor.ro", name: SITE_NAME, email: "info@cumparatisenzor.ro" },
  hu: { url: "https://szenzorvasarlas.hu", name: "Szenzorvasarlas.hu", email: "info@szenzorvasarlas.hu" },
  eu: { url: EU_SITE_ORIGIN, name: "kupitsensor.eu", email: "info@kupitsensor.eu" },
};

/**
 * Schema.org Organization + WebSite pentru pagina principală a fiecărei piețe.
 */
export function JsonLdSite({ variant = "ro" }: { variant?: SiteVariant }) {
  const config = VARIANT_CONFIG[variant];
  // RO keeps resolving through getPublicSiteUrl() (respects NEXT_PUBLIC_SITE_URL /
  // preview overrides); HU/EU use their fixed production domains like elsewhere in this file.
  const url = variant === "ro" ? getPublicSiteUrl() : config.url;
  const logoUrl = `${url}${SEO_DEFAULT_OG_IMAGE_PATH}`;

  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: config.name,
      url,
      logo: logoUrl,
      email: config.email,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.name,
      url,
      publisher: { "@type": "Organization", name: config.name, url },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
