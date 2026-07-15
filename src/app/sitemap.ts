import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublicSiteUrlForVariant, getRequestSiteVariant } from "@/lib/site-url";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
};

/** Public URLs on cumparatisenzor.ro. */
const RO_PATHS: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/despre-libre", changeFrequency: "monthly", priority: 0.85 },
  { path: "/despre-noi", changeFrequency: "monthly", priority: 0.75 },
  { path: "/comanda", changeFrequency: "weekly", priority: 0.9 },
  { path: "/termeni-si-conditii", changeFrequency: "yearly", priority: 0.4 },
  { path: "/gdpr", changeFrequency: "yearly", priority: 0.4 },
];

/** Public URLs on szenzorvasarlas.hu (middleware serves src/app/hu/* here, unprefixed). */
const HU_PATHS: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/despre-libre", changeFrequency: "monthly", priority: 0.8 },
  { path: "/rolunk", changeFrequency: "monthly", priority: 0.7 },
  { path: "/comanda", changeFrequency: "weekly", priority: 0.85 },
  { path: "/libre-2-plus-alkalmazasok", changeFrequency: "monthly", priority: 0.6 },
  { path: "/aszf", changeFrequency: "yearly", priority: 0.35 },
  { path: "/adatkezeles", changeFrequency: "yearly", priority: 0.35 },
];

/** Public URLs on kupitsensor.eu */
const EU_PATHS: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/libre-2-vs-libre-2-plus", changeFrequency: "monthly", priority: 0.95 },
  { path: "/voprosy-o-libre", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pro-datchik", changeFrequency: "monthly", priority: 0.85 },
  { path: "/o-nas", changeFrequency: "monthly", priority: 0.7 },
  { path: "/prilozheniya", changeFrequency: "monthly", priority: 0.6 },
  { path: "/comanda", changeFrequency: "weekly", priority: 0.9 },
  { path: "/kontakt", changeFrequency: "monthly", priority: 0.5 },
  { path: "/usloviya", changeFrequency: "yearly", priority: 0.35 },
  { path: "/konfidencialnost", changeFrequency: "yearly", priority: 0.35 },
  { path: "/ua", changeFrequency: "weekly", priority: 0.95 },
  { path: "/ua/libre-2-vs-libre-2-plus", changeFrequency: "monthly", priority: 0.9 },
  { path: "/ua/zapytannya-pro-libre", changeFrequency: "monthly", priority: 0.85 },
  { path: "/ua/pro-sensor", changeFrequency: "monthly", priority: 0.8 },
  { path: "/ua/pro-nas", changeFrequency: "monthly", priority: 0.65 },
  { path: "/ua/dodatky", changeFrequency: "monthly", priority: 0.55 },
  { path: "/ua/comanda", changeFrequency: "weekly", priority: 0.85 },
  { path: "/ua/kontakt", changeFrequency: "monthly", priority: 0.45 },
  { path: "/ua/umovy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/ua/konfidentsiynist", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const variant = getRequestSiteVariant(headers());
  const base = getPublicSiteUrlForVariant(variant);
  const paths = variant === "hu" ? HU_PATHS : variant === "eu" ? EU_PATHS : RO_PATHS;
  const lastModified = new Date();

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
