import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

/** Doar rute publice, indexabile. */
const PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] =
  [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/despre-libre", changeFrequency: "monthly", priority: 0.85 },
    { path: "/despre-noi", changeFrequency: "monthly", priority: 0.75 },
    { path: "/comanda", changeFrequency: "weekly", priority: 0.9 },
    { path: "/termeni-si-conditii", changeFrequency: "yearly", priority: 0.4 },
    { path: "/gdpr", changeFrequency: "yearly", priority: 0.4 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();
  const lastModified = new Date();

  return PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
