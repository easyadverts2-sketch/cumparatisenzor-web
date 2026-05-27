import { EU_DELIVERY_COUNTRIES, type EuDeliveryCountry } from "./types";

const COUNTRY_NAMES_RU: Record<EuDeliveryCountry, string> = {
  DE: "Германия",
  PL: "Польша",
  AT: "Австрия",
};

export function isEuDeliveryCountry(value: string): value is EuDeliveryCountry {
  return (EU_DELIVERY_COUNTRIES as readonly string[]).includes(value);
}

export function euCountryLabelRu(country: EuDeliveryCountry): string {
  return COUNTRY_NAMES_RU[country];
}

export function normalizeEuPostalCode(country: EuDeliveryCountry, raw: string): string {
  const trimmed = raw.trim();
  if (country === "PL") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 5) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return trimmed;
  }
  return trimmed.replace(/\s+/g, "");
}

export function validateEuPostalCode(country: EuDeliveryCountry, postalCode: string): boolean {
  const code = normalizeEuPostalCode(country, postalCode);
  if (country === "DE") return /^\d{5}$/.test(code);
  if (country === "AT") return /^\d{4}$/.test(code);
  if (country === "PL") return /^\d{2}-\d{3}$/.test(code);
  return false;
}

export function formatEuDeliveryAddress(input: {
  street: string;
  city: string;
  postalCode: string;
  country: EuDeliveryCountry;
}): string {
  const postal = normalizeEuPostalCode(input.country, input.postalCode);
  return `${input.street}, ${input.city}, ${postal}, ${euCountryLabelRu(input.country)}`;
}
