import type { Metadata } from "next";
import { EuComparePage } from "@/components/eu-compare-page";
import { euCompareContent } from "@/lib/eu-seo-pages";

const c = euCompareContent.uk;

export const metadata: Metadata = {
  title: { absolute: `${c.metaTitle} | kupitsensor.eu` },
  description: c.metaDescription,
  alternates: {
    canonical: "/ua/libre-2-vs-libre-2-plus",
    languages: {
      uk: "https://kupitsensor.eu/ua/libre-2-vs-libre-2-plus",
      ru: "https://kupitsensor.eu/libre-2-vs-libre-2-plus",
    },
  },
  openGraph: {
    locale: "uk_UA",
    title: c.metaTitle,
    description: c.metaDescription,
    url: "https://kupitsensor.eu/ua/libre-2-vs-libre-2-plus",
  },
};

export default function EuCompareUaRoute() {
  return <EuComparePage locale="uk" />;
}
