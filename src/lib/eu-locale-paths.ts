import type { EuLocale } from "./eu-market-content";

/** Path builder so page components don't hardcode /eu vs /eu/ua branching everywhere. */
export function euPaths(locale: EuLocale) {
  const base = locale === "uk" ? "/eu/ua" : "/eu";
  return {
    home: base,
    aboutSensor: locale === "uk" ? "/eu/ua/pro-sensor" : "/eu/pro-datchik",
    aboutUs: locale === "uk" ? "/eu/ua/pro-nas" : "/eu/o-nas",
    apps: locale === "uk" ? "/eu/ua/dodatky" : "/eu/prilozheniya",
    order: `${base}/comanda`,
    contact: `${base}/kontakt`,
    terms: locale === "uk" ? "/eu/ua/umovy" : "/eu/usloviya",
    privacy: locale === "uk" ? "/eu/ua/konfidentsiynist" : "/eu/konfidencialnost",
  };
}
