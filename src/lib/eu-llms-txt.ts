import { euSiteUrl } from "./site-url";

/**
 * llms.txt — short site summary for AI crawlers (llmstxt.org convention).
 * Served only on kupitsensor.eu; see src/app/llms.txt/route.ts.
 */
export function buildEuLlmsTxt(): string {
  const lines = [
    "# kupitsensor.eu",
    "",
    "> Online shop for Abbott FreeStyle Libre 2 Plus glucose sensors with delivery to Germany, Poland, and Austria. Russian and Ukrainian customer support.",
    "",
    "## About",
    "- Product: FreeStyle Libre 2 Plus (replacement for Libre 2, 15-day wear, automatic readings)",
    "- Markets: Germany (DE), Poland (PL), Austria (AT)",
    "- Languages: Russian (RU) and Ukrainian (UK) storefronts",
    "- Currency: EUR",
    "- Payment: card (Stripe), bank transfer, cash on delivery where available",
    "- Shipping: PPL / DPD",
    "- Operator: Czech retail company (Česká maloobchodní s.r.o.)",
    "- Contact: info@kupitsensor.eu, phone +420 777 577 352",
    "",
    "## Key pages (Russian)",
    `- Home: ${euSiteUrl("/")}`,
    `- Order Libre 2 Plus: ${euSiteUrl("/comanda")}`,
    `- Libre 2 vs Libre 2 Plus comparison: ${euSiteUrl("/libre-2-vs-libre-2-plus")}`,
    `- FAQ about Libre sensors: ${euSiteUrl("/voprosy-o-libre")}`,
    `- Customer reviews: ${euSiteUrl("/otzyvy")}`,
    `- About the sensor: ${euSiteUrl("/pro-datchik")}`,
    `- About us: ${euSiteUrl("/o-nas")}`,
    `- Contact: ${euSiteUrl("/kontakt")}`,
    "",
    "## Key pages (Ukrainian)",
    `- Home: ${euSiteUrl("/ua")}`,
    `- Order: ${euSiteUrl("/ua/comanda")}`,
    `- Comparison: ${euSiteUrl("/ua/libre-2-vs-libre-2-plus")}`,
    `- FAQ: ${euSiteUrl("/ua/zapytannya-pro-libre")}`,
    `- Reviews: ${euSiteUrl("/ua/vidhuky")}`,
    `- About us: ${euSiteUrl("/ua/pro-nas")}`,
    `- Contact: ${euSiteUrl("/ua/kontakt")}`,
    "",
    "## Sitemap",
    `- ${euSiteUrl("/sitemap.xml")}`,
    "",
    "## Optional",
    `- Full product name: Abbott FreeStyle Libre 2 Plus`,
    `- Also known as: Libre 2 Plus, FreeStyle Libre 2, CGM sensor`,
  ];

  return `${lines.join("\n")}\n`;
}
