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
    { path: "/hu", changeFrequency: "weekly", priority: 0.95 },
    { path: "/hu/despre-libre", changeFrequency: "monthly", priority: 0.8 },
    { path: "/hu/rolunk", changeFrequency: "monthly", priority: 0.7 },
    { path: "/hu/comanda", changeFrequency: "weekly", priority: 0.85 },
    { path: "/hu/aszf", changeFrequency: "yearly", priority: 0.35 },
    { path: "/hu/adatkezeles", changeFrequency: "yearly", priority: 0.35 },
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
