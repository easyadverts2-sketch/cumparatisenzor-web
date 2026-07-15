import type { Metadata } from "next";
import { LibreAppsOverviewPage } from "@/components/libre-apps-overview-page";
import { libreAppsContent } from "@/lib/libre-apps-content";

const c = libreAppsContent.uk;

export const metadata: Metadata = {
  title: c.pageTitle,
  description: c.intro,
  alternates: {
    canonical: "/ua/dodatky",
    languages: {
      uk: "https://kupitsensor.eu/ua/dodatky",
      ru: "https://kupitsensor.eu/prilozheniya",
    },
  },
};

export default function EuAppsUaRoute() {
  return <LibreAppsOverviewPage locale="uk" />;
}
