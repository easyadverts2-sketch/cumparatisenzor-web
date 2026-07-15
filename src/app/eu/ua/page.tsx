import type { Metadata } from "next";
import { EuHomePage } from "@/components/eu-home-page";
import { euHomeContent } from "@/lib/eu-market-content";

const c = euHomeContent.uk;

export const metadata: Metadata = {
  title: { absolute: `${c.metaTitle} | kupitsensor.eu` },
  description: c.metaDescription,
  alternates: {
    canonical: "/ua",
    languages: {
      uk: "https://kupitsensor.eu/ua",
      ru: "https://kupitsensor.eu/",
      "x-default": "https://kupitsensor.eu/",
    },
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "kupitsensor.eu",
    url: "https://kupitsensor.eu/ua",
    title: c.metaTitle,
    description: c.metaDescription,
  },
};

export default function EuHomeUaRoute() {
  return <EuHomePage locale="uk" />;
}
