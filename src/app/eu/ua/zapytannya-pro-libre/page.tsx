import type { Metadata } from "next";
import { EuFaqPage } from "@/components/eu-faq-page";
import { euFaqContent } from "@/lib/eu-seo-pages";

const c = euFaqContent.uk;

export const metadata: Metadata = {
  title: { absolute: `${c.metaTitle} | kupitsensor.eu` },
  description: c.metaDescription,
  alternates: {
    canonical: "/ua/zapytannya-pro-libre",
    languages: {
      uk: "https://kupitsensor.eu/ua/zapytannya-pro-libre",
      ru: "https://kupitsensor.eu/voprosy-o-libre",
    },
  },
  openGraph: {
    locale: "uk_UA",
    title: c.metaTitle,
    description: c.metaDescription,
    url: "https://kupitsensor.eu/ua/zapytannya-pro-libre",
  },
};

export default function EuFaqUaRoute() {
  return <EuFaqPage locale="uk" />;
}
