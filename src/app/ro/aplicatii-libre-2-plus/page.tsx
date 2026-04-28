import type { Metadata } from "next";
import { LibreAppsOverviewPage } from "@/components/libre-apps-overview-page";

export const metadata: Metadata = {
  title: "Aplicatii pentru FreeStyle Libre 2 Plus",
  description:
    "Prezentare editoriala a aplicatiilor oficiale Abbott si a aplicatiilor terte folosite cu FreeStyle Libre 2 Plus.",
  alternates: { canonical: "/ro/aplicatii-libre-2-plus" },
};

export default function LibreAppsRoPage() {
  return <LibreAppsOverviewPage locale="ro" />;
}

