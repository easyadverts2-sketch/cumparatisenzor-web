import type { Metadata } from "next";
import { EuAboutSensorPage } from "@/components/eu-about-sensor-page";
import { euAboutSensorContent } from "@/lib/eu-market-content";

const c = euAboutSensorContent.uk;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: {
    canonical: "/ua/pro-sensor",
    languages: {
      uk: "https://kupitsensor.eu/ua/pro-sensor",
      ru: "https://kupitsensor.eu/pro-datchik",
    },
  },
};

export default function EuAboutSensorUaRoute() {
  return <EuAboutSensorPage locale="uk" />;
}
