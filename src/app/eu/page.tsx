import type { Metadata } from "next";
import { EuHomePage } from "@/components/eu-home-page";
import { euHomeContent } from "@/lib/eu-market-content";

const c = euHomeContent.ru;

export const metadata: Metadata = {
  title: { absolute: `${c.metaTitle} | kupitsensor.eu` },
  description: c.metaDescription,
  alternates: {
    canonical: "/",
    languages: {
      ru: "https://www.kupitsensor.eu/",
      uk: "https://www.kupitsensor.eu/ua",
      "x-default": "https://www.kupitsensor.eu/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "kupitsensor.eu",
    url: "https://www.kupitsensor.eu",
    title: c.metaTitle,
    description: c.metaDescription,
  },
};

export default function EuHomePageRoute() {
  return <EuHomePage locale="ru" />;
}
