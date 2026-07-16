import { SEO_DEFAULT_OG_IMAGE_PATH } from "@/lib/seo-config";

const EU_SITE = "https://kupitsensor.eu";
/** Fallback list price; live checkout may differ via admin settings. */
const EU_LIST_PRICE_EUR = "60.00";
/** Standard PPL/DPD shipping under 5 units (matches EU store default). */
const EU_SHIPPING_EUR = "7.00";

/**
 * Product + Offer schema for FreeStyle Libre 2 Plus on the EU market.
 * Includes Merchant listing fields Google Search Console expects
 * (shippingRate, deliveryTime, hasMerchantReturnPolicy).
 */
export function JsonLdEuProduct({ locale }: { locale: "ru" | "uk" }) {
  const orderPath = locale === "uk" ? "/ua/comanda" : "/comanda";
  const termsPath = locale === "uk" ? "/ua/umovy" : "/usloviya";
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
        shippingRate: {
          "@type": "MonetaryAmount",
          value: EU_SHIPPING_EUR,
          currency: "EUR",
        },
        shippingDestination: [
          { "@type": "DefinedRegion", addressCountry: "DE" },
          { "@type": "DefinedRegion", addressCountry: "PL" },
          { "@type": "DefinedRegion", addressCountry: "AT" },
        ],
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: ["DE", "PL", "AT"],
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        url: `${EU_SITE}${termsPath}`,
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
