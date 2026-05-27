import {
  euCountryLabelRu,
  formatEuDeliveryAddress,
  isEuDeliveryCountry,
  normalizeEuPostalCode,
  validateEuPostalCode,
} from "@/lib/eu-address";
import { SHIPPING_CARRIERS, type EuDeliveryCountry, type Order, type ShippingCarrier } from "@/lib/types";

export function parsePaymentMethod(raw: unknown): Order["paymentMethod"] {
  const s = String(raw || "");
  if (s === "CARD_STRIPE") return "CARD_STRIPE";
  if (s === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (s === "COD") return "COD";
  return "COD";
}

export function parseShippingCarrier(raw: unknown): ShippingCarrier | null {
  const s = String(raw || "").toUpperCase();
  if (s === "PACKETA") return "DPD";
  if ((SHIPPING_CARRIERS as readonly string[]).includes(s)) {
    return s as ShippingCarrier;
  }
  return null;
}

type AddressPayload = {
  street: string;
  city: string;
  postalCode: string;
  country: EuDeliveryCountry;
};

export function toSafe(v: unknown): string {
  return String(v || "").trim();
}

export function parseEuCountry(raw: unknown): EuDeliveryCountry | null {
  const c = toSafe(raw).toUpperCase();
  return isEuDeliveryCountry(c) ? c : null;
}

export function validateEuAddress(addr: AddressPayload): string | null {
  if (addr.street.length < 5) return "Уточните улицу и номер дома.";
  if (addr.city.length < 2) return "Укажите город.";
  if (!validateEuPostalCode(addr.country, addr.postalCode)) {
    if (addr.country === "DE") return "Почтовый индекс Германии — 5 цифр.";
    if (addr.country === "AT") return "Почтовый индекс Австрии — 4 цифры.";
    return "Почтовый индекс Польши — формат NN-NNN или 5 цифр.";
  }
  return null;
}

export function formatEuAddress(addr: AddressPayload): string {
  return formatEuDeliveryAddress({
    street: addr.street,
    city: addr.city,
    postalCode: normalizeEuPostalCode(addr.country, addr.postalCode),
    country: addr.country,
  });
}

export function euHostAllowed(host: string): boolean {
  return host.includes("sensorglukoz.eu") || host.includes("localhost");
}

export function euCountryNameRu(country: EuDeliveryCountry): string {
  return euCountryLabelRu(country);
}
