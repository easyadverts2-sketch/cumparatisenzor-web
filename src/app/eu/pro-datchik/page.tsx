import type { Metadata } from "next";
import { EuAboutSensorPage } from "@/components/eu-about-sensor-page";
import { euAboutSensorContent } from "@/lib/eu-market-content";

const c = euAboutSensorContent.ru;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: {
    canonical: "/pro-datchik",
    languages: {
      ru: "https://kupitsensor.eu/pro-datchik",
      uk: "https://kupitsensor.eu/ua/pro-sensor",
    },
  },
};

export default function EuAboutSensorRoute() {
  return <EuAboutSensorPage locale="ru" />;
}
