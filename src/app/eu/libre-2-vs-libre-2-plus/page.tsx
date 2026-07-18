import type { Metadata } from "next";
import { EuComparePage } from "@/components/eu-compare-page";
import { euCompareContent } from "@/lib/eu-seo-pages";

const c = euCompareContent.ru;

export const metadata: Metadata = {
  title: { absolute: `${c.metaTitle} | kupitsensor.eu` },
  description: c.metaDescription,
  alternates: {
    canonical: "/libre-2-vs-libre-2-plus",
    languages: {
      ru: "https://www.kupitsensor.eu/libre-2-vs-libre-2-plus",
      uk: "https://www.kupitsensor.eu/ua/libre-2-vs-libre-2-plus",
    },
  },
  openGraph: {
    locale: "ru_RU",
    title: c.metaTitle,
    description: c.metaDescription,
    url: "https://www.kupitsensor.eu/libre-2-vs-libre-2-plus",
  },
};

export default function EuCompareRoute() {
  return <EuComparePage locale="ru" />;
}
