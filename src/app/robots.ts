import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublicSiteUrlForVariant, getRequestSiteVariant } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const variant = getRequestSiteVariant(headers());
  const base = getPublicSiteUrlForVariant(variant);
  const adminPaths = variant === "hu" ? ["/hu-admin", "/hu-admin/"] : ["/admin", "/admin/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...adminPaths, "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
