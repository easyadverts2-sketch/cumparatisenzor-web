import type { Metadata } from "next";
import { EuFaqPage } from "@/components/eu-faq-page";
import { euFaqContent } from "@/lib/eu-seo-pages";

const c = euFaqContent.ru;

export const metadata: Metadata = {
  title: { absolute: `${c.metaTitle} | kupitsensor.eu` },
  description: c.metaDescription,
  alternates: {
    canonical: "/voprosy-o-libre",
    languages: {
      ru: "https://kupitsensor.eu/voprosy-o-libre",
      uk: "https://kupitsensor.eu/ua/zapytannya-pro-libre",
    },
  },
  openGraph: {
    locale: "ru_RU",
    title: c.metaTitle,
    description: c.metaDescription,
    url: "https://kupitsensor.eu/voprosy-o-libre",
  },
};

export default function EuFaqRoute() {
  return <EuFaqPage locale="ru" />;
}
