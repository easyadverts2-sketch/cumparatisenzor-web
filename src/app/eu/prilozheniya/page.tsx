import type { Metadata } from "next";
import { LibreAppsOverviewPage } from "@/components/libre-apps-overview-page";
import { libreAppsContent } from "@/lib/libre-apps-content";

const c = libreAppsContent.ru;

export const metadata: Metadata = {
  title: c.pageTitle,
  description: c.intro,
  alternates: {
    canonical: "/prilozheniya",
    languages: {
      ru: "https://www.kupitsensor.eu/prilozheniya",
      uk: "https://www.kupitsensor.eu/ua/dodatky",
    },
  },
};

export default function EuAppsRoute() {
  return <LibreAppsOverviewPage locale="ru" />;
}
