import type { Metadata } from "next";
import { EuAboutUsPage } from "@/components/eu-about-us-page";
import { euAboutUsContent } from "@/lib/eu-market-content";

const c = euAboutUsContent.uk;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: {
    canonical: "/ua/pro-nas",
    languages: {
      uk: "https://kupitsensor.eu/ua/pro-nas",
      ru: "https://kupitsensor.eu/o-nas",
    },
  },
};

export default function EuAboutUsUaRoute() {
  return <EuAboutUsPage locale="uk" />;
}
