import { SEO_DEFAULT_OG_IMAGE_PATH } from "@/lib/seo-config";

const EU_SITE = "https://kupitsensor.eu";
/** Fallback list price; live checkout may differ via admin settings. */
const EU_LIST_PRICE_EUR = "60.00";

/**
 * Product + Offer schema for FreeStyle Libre 2 Plus on the EU market.
 * Helps commercial queries ("купить Libre 2", "Libre 2 Plus") surface rich results.
 */
export function JsonLdEuProduct({ locale }: { locale: "ru" | "uk" }) {
  const orderPath = locale === "uk" ? "/ua/comanda" : "/comanda";
  const productName = "FreeStyle Libre 2 Plus";
  const description =
    locale === "uk"
      ? "Оригінальний сенсор Abbott FreeStyle Libre 2 Plus (заміна Libre 2). Доставка до Німеччини, Польщі та Австрії, підтримка українською та російською."
      : "Оригинальный сенсор Abbott FreeStyle Libre 2 Plus (замена Libre 2). Доставка в Германию, Польшу и Австрию, поддержка на русском и украинском.";

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    alternateName: ["Libre 2 Plus", "Libre 2", "FreeStyle Libre 2"],
    description,
    image: `${EU_SITE}${SEO_DEFAULT_OG_IMAGE_PATH}`,
    brand: { "@type": "Brand", name: "Abbott" },
    sku: "LIBRE-2-PLUS",
    offers: {
      "@type": "Offer",
      url: `${EU_SITE}${orderPath}`,
      priceCurrency: "EUR",
      price: EU_LIST_PRICE_EUR,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: [
          { "@type": "DefinedRegion", addressCountry: "DE" },
          { "@type": "DefinedRegion", addressCountry: "PL" },
          { "@type": "DefinedRegion", addressCountry: "AT" },
        ],
      },
      seller: {
        "@type": "Organization",
        name: "kupitsensor.eu",
        url: EU_SITE,
      },
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function JsonLdEuFaq({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
