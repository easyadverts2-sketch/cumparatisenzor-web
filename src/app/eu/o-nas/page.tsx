import type { Metadata } from "next";
import { EuAboutUsPage } from "@/components/eu-about-us-page";
import { euAboutUsContent } from "@/lib/eu-market-content";

const c = euAboutUsContent.ru;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: {
    canonical: "/o-nas",
    languages: {
      ru: "https://www.kupitsensor.eu/o-nas",
      uk: "https://www.kupitsensor.eu/ua/pro-nas",
    },
  },
};

export default function EuAboutUsRoute() {
  return <EuAboutUsPage locale="ru" />;
}
