import type { Metadata } from "next";
import { EuHomePage } from "@/components/eu-home-page";
import { euHomeContent } from "@/lib/eu-market-content";

const c = euHomeContent.ru;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: {
    canonical: "/",
    languages: {
      ru: "https://kupitsensor.eu/",
      uk: "https://kupitsensor.eu/ua",
      "ro-RO": "https://cumparatisenzor.ro/",
      "hu-HU": "https://szenzorvasarlas.hu/",
      "x-default": "https://cumparatisenzor.ro/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "kupitsensor.eu",
    url: "https://kupitsensor.eu",
    title: c.metaTitle,
    description: c.metaDescription,
  },
};

export default function EuHomePageRoute() {
  return <EuHomePage locale="ru" />;
}
