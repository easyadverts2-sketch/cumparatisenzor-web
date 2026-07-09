import type { Market } from "./types";

/** Hlavní provozní e-mail pro upozornění na nové objednávky (RO + HU). */
export const DEFAULT_OPERATOR_ORDER_EMAIL = "filiprossler@gmail.com";

function marketInternalEmailFromEnv(market: Market): string {
  if (market === "HU") {
    return (
      process.env.INTERNAL_ORDER_EMAIL_HU ||
      process.env.INTERNAL_ORDER_EMAIL ||
      "info@szenzorvasarlas.hu"
    );
  }
  if (market === "EU") {
    return (
      process.env.INTERNAL_ORDER_EMAIL_EU ||
      process.env.INTERNAL_ORDER_EMAIL ||
      "info@sensorglukoz.eu"
    );
  }
  return (
    process.env.INTERNAL_ORDER_EMAIL_RO ||
    process.env.INTERNAL_ORDER_EMAIL ||
    "info@cumparatisenzor.ro"
  );
}

/** E-mailové adresy, které dostanou interní upozornění při nové objednávce. */
export function internalOrderNotificationEmails(market: Market): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  function add(raw: string) {
    const email = String(raw || "").trim();
    const key = email.toLowerCase();
    if (!email.includes("@") || seen.has(key)) return;
    seen.add(key);
    out.push(email);
  }

  if (market === "RO" || market === "HU") {
    add(process.env.INTERNAL_ORDER_EMAIL_OPERATOR?.trim() || DEFAULT_OPERATOR_ORDER_EMAIL);
  }

  add(marketInternalEmailFromEnv(market));
  return out;
}

export function internalOrderEmailForMarket(market: Market): string {
  const list = internalOrderNotificationEmails(market);
  return list[0] || marketInternalEmailFromEnv(market);
}
