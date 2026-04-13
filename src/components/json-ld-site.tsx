import { getPublicSiteUrl } from "@/lib/site-url";
import { SEO_DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "@/lib/seo-config";

const CONTACT_EMAIL = "info@cumparatisenzor.ro";

/**
 * Schema.org Organization + WebSite pentru pagina principală.
 */
export function JsonLdSite() {
  const url = getPublicSiteUrl();
  const logoUrl = `${url}${SEO_DEFAULT_OG_IMAGE_PATH}`;

  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url,
      logo: logoUrl,
      email: CONTACT_EMAIL,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url,
      publisher: { "@type": "Organization", name: SITE_NAME, url },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
