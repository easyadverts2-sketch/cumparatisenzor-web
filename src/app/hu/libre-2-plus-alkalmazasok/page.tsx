import type { Metadata } from "next";
import { LibreAppsOverviewPage } from "@/components/libre-apps-overview-page";

export const metadata: Metadata = {
  title: "Alkalmazások FreeStyle Libre 2 Plus szenzorokhoz",
  description:
    "Szerkesztosegi attekintes az Abbott hivatalos es harmadik feles alkalmazasokrol FreeStyle Libre 2 Plus-hoz.",
  alternates: { canonical: "/hu/libre-2-plus-alkalmazasok" },
};

export default function LibreAppsHuPage() {
  return <LibreAppsOverviewPage locale="hu" />;
}

