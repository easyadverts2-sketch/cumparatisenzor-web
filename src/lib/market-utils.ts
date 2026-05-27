import type { Market, ShippingCarrier } from "./types";

/** Premium Fineship flat rate for EU market (EUR). */
export const EU_FINESHIP_SHIPPING_EUR = 30;

export function parseMarketCode(raw: string | null | undefined): Market {
  const u = String(raw || "").toUpperCase();
  if (u === "HU") return "HU";
  if (u === "EU") return "EU";
  return "RO";
}

export function computeShippingPrice(
  market: Market,
  carrier: ShippingCarrier,
  quantity: number,
  configuredShipping: number
): number {
  if (carrier === "FINESHIP") {
    if (market === "HU") return 16000;
    if (market === "EU") return EU_FINESHIP_SHIPPING_EUR;
    return 200;
  }
  if (quantity >= 5) return 0;
  return configuredShipping;
}

export function priceToleranceForMarket(market: Market): number {
  return market === "HU" ? 1 : 0.01;
}
