import type { Market, Order } from "./types";

type DpdResult =
  | {
      ok: true;
      shipmentId: string;
      shipmentIdSourcePath: string;
      trackingNumber: string | null;
      trackingSourcePath: string | null;
      raw?: unknown;
      createRequest?: unknown;
      httpStatus?: number | null;
    }
  | { ok: false; reason: string; raw?: unknown; httpStatus?: number | null; createRequest?: unknown };

type DpdGenericResult<T> =
  | { ok: true; data: T; raw?: unknown; httpStatus?: number | null }
  | { ok: false; reason: string; raw?: unknown; httpStatus?: number | null };

export type DpdAuthDiagnostics = {
  operation?:
    | "createShipment"
    | "getLabelByShipmentIds"
    | "getLabelByParcelNumbers"
    | "cancelShipment"
    | "createPickup"
    | "cancelPickup"
    | "shipmentInfo";
  tokenPresent: boolean;
  tokenLength: number;
  tokenDotCount: number;
  tokenLooksLikeJwt: boolean;
  tokenHasWhitespaceAtEdges: boolean;
  tokenStartsWithBearer: boolean;
  customerIdPresent: boolean;
  customerIdLength: number;
  senderAddressIdPresent: boolean;
  senderAddressIdLength: number;
  buCode: string;
  authorizationHeaderScheme: "Bearer";
  requestHeadersShape: {
    Authorization: "Bearer ***";
    "Content-Type": "application/json";
    Accept: "application/json";
  };
  baseUrl: string;
  endpointPath: string;
  finalUrl: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  actualHttpBodySentToDpd?: unknown;
  requestBodySafe?: unknown;
  responseStatus: number | null;
  responseBodySafe?: unknown;
  responseTextSafe?: string | null;
  responseJsonSafe?: unknown;
  correlationId?: string | null;
  transactionId?: string | null;
  timestamp: string;
};

export type DpdEndpointAttempt = {
  step: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  status: number | null;
  contentType: string | null;
  contentLength: string | null;
  durationMs: number;
  looksLikePdf?: boolean;
  error?: string | null;
  requestBodySafe?: unknown;
  responseTextSafe?: string | null;
  responseJsonSafe?: unknown;
  responseWasJsonWrapper?: boolean;
  transactionId?: unknown;
};

export type DpdPickupInput = {
  pickupDate: string;
  fromTime: string;
  toTime: string;
  contactName: string;
  phone: string;
  contactEmail?: string;
  note?: string;
  parcelCount: number;
  totalWeight: number;
  shipmentIds?: Array<string | number>;
};

type DpdLabelFetchInput = {
  shipmentIds?: string[];
  parcelNumbers?: string[];
};

function isEnabled() {
  return process.env.DPD_API_ENABLED === "true";
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function normalizeDpdOrigin(baseUrlRaw: string): string {
  const fallback = "https://shipping.dpdgroup.com";
  const raw = String(baseUrlRaw || "").trim() || fallback;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    parsed = new URL(fallback);
  }
  return `${parsed.protocol}//${parsed.host}`;
}

function configured() {
  const baseUrlRaw = process.env.DPD_API_BASE_URL?.trim() || "https://shipping.dpdgroup.com/api/v1.1";
  const tokenRaw = process.env.DPD_API_TOKEN;
  const token = tokenRaw?.trim();
  const customerId = process.env.DPD_API_CUSTOMER_ID?.trim();
  const senderAddressId = process.env.DPD_API_SENDER_ADDRESS_ID?.trim();
  const buCode = process.env.DPD_API_BU_CODE?.trim() || "015";
  return { baseUrlRaw, tokenRaw, token, customerId, senderAddressId, buCode };
}

function tokenLooksLikeJwt(token: string | undefined) {
  const t = String(token || "").trim();
  return t.split(".").length === 3;
}

function sanitizeBodySafe(input: unknown): unknown {
  if (input == null) return null;
  if (Array.isArray(input)) return input.map((x) => sanitizeBodySafe(x));
  if (typeof input !== "object") return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    if (lower.includes("token") || lower.includes("authorization") || lower.includes("cookie")) continue;
    if (typeof v === "string" && v.length > 4000) out[k] = `${v.slice(0, 4000)}...<truncated>`;
    else out[k] = sanitizeBodySafe(v);
  }
  return out;
}

function resolveEndpoint(baseUrlRaw: string, apiVersion: "v1.1" | "v1.0", endpointPath: string) {
  const origin = normalizeDpdOrigin(baseUrlRaw);
  const noApiPrefix = endpointPath
    .replace(/^\/+api\/v1\.[01]\//i, "/")
    .replace(/^\/+v1\.[01]\//i, "/")
    .replace(/^\/+api\//i, "/");
  const cleanEndpoint = `/${noApiPrefix.replace(/^\/+/, "")}`;
  const normalizedRoot = `${origin}/api`;
  const finalUrl = `${normalizedRoot}/${apiVersion}${cleanEndpoint}`;
  return {
    normalizedBaseUrl: `${normalizedRoot}/${apiVersion}`,
    endpointPath: cleanEndpoint,
    finalUrl: finalUrl.replace(/([^:]\/)\/+/g, "$1"),
  };
}

export function dpdUrl(apiVersion: "v1.1" | "v1.0", endpointPath: string, baseUrlRaw?: string): string {
  return resolveEndpoint(baseUrlRaw || configured().baseUrlRaw, apiVersion, endpointPath).finalUrl;
}

export function buildDpdAuthDiagnostics(params: {
  operation?:
    | "createShipment"
    | "getLabelByShipmentIds"
    | "getLabelByParcelNumbers"
    | "cancelShipment"
    | "createPickup"
    | "cancelPickup"
    | "shipmentInfo";
  endpointPath: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  requestBodySafe?: unknown;
  responseStatus?: number | null;
  responseTextSafe?: string | null;
  responseJsonSafe?: unknown;
  responseBodySafe?: unknown;
  correlationId?: string | null;
  transactionId?: string | null;
  apiVersion?: "v1.1" | "v1.0";
}): DpdAuthDiagnostics {
  const cfg = configured();
  const tokenRaw = String(cfg.tokenRaw || "");
  const token = String(cfg.token || "");
  const tokenNoTrim = String(cfg.tokenRaw || "");
  const endpoint = resolveEndpoint(cfg.baseUrlRaw, params.apiVersion || "v1.1", params.endpointPath);
  return {
    operation: params.operation,
    tokenPresent: token.length > 0,
    tokenLength: token.length,
    tokenDotCount: token.length > 0 ? token.split(".").length - 1 : 0,
    tokenLooksLikeJwt: tokenLooksLikeJwt(cfg.token),
    tokenHasWhitespaceAtEdges: tokenRaw.length > 0 && tokenRaw !== tokenRaw.trim(),
    tokenStartsWithBearer: /^\s*bearer\s+/i.test(tokenNoTrim),
    customerIdPresent: String(cfg.customerId || "").length > 0,
    customerIdLength: String(cfg.customerId || "").length,
    senderAddressIdPresent: String(cfg.senderAddressId || "").length > 0,
    senderAddressIdLength: String(cfg.senderAddressId || "").length,
    buCode: cfg.buCode,
    authorizationHeaderScheme: "Bearer",
    requestHeadersShape: {
      Authorization: "Bearer ***",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    baseUrl: endpoint.normalizedBaseUrl,
    endpointPath: endpoint.endpointPath,
    finalUrl: endpoint.finalUrl,
    method: params.method,
    actualHttpBodySentToDpd: sanitizeBodySafe(params.requestBodySafe),
    requestBodySafe: sanitizeBodySafe(params.requestBodySafe),
    responseStatus: params.responseStatus ?? null,
    responseTextSafe: params.responseTextSafe ? String(params.responseTextSafe).slice(0, 10000) : null,
    responseJsonSafe: sanitizeBodySafe(params.responseJsonSafe),
    responseBodySafe: sanitizeBodySafe(params.responseBodySafe),
    correlationId: params.correlationId || null,
    transactionId: params.transactionId || null,
    timestamp: new Date().toISOString(),
  };
}

function normalizeAscii(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDeliveryAddress(deliveryAddress: string, countryCode: "RO" | "HU") {
  const text = String(deliveryAddress || "").replace(/\n+/g, ", ");
  const chunks = text
    .split(",")
    .map((chunk) => normalizeAscii(chunk))
    .filter(Boolean);
  const badStreetPrefixes = [/^destinatar[:\s]/i, /^cimzett[:\s]/i, /^recipient[:\s]/i];
  const street =
    chunks.find((c) => {
      const low = c.toLowerCase();
      if (badStreetPrefixes.some((rx) => rx.test(low))) return false;
      if (/^\d{4,6}$/.test(low)) return false;
      if (/^(romania|hungary|magyarorszag|ro|hu)$/i.test(low)) return false;
      return true;
    }) || "";
  const zipRegex = countryCode === "HU" ? /\b(\d{4})\b/ : /\b(\d{6})\b/;
  const zipMatch = normalizeAscii(text).match(zipRegex);
  const zipCode = zipMatch ? zipMatch[1] : "";
  const countryWords = new Set(["romania", "romania.", "ro", "hungary", "magyarorszag", "hu"]);

  let city = "";
  const judChunk = chunks.find((c) => /^jud\.?\s+/i.test(c));
  if (judChunk) {
    city = judChunk.replace(/^jud\.?\s*/i, "").trim();
  }
  if (!city) {
    const cityCandidate = chunks.find((c) => {
      const low = c.toLowerCase();
      if (countryWords.has(low)) return false;
      if (/^\d{4,8}$/.test(low)) return false;
      if (/^jud\.?\s+/i.test(low)) return false;
      return c !== street;
    });
    city = cityCandidate || "";
  }

  const additionalAddressInfo = chunks
    .slice(1)
    .filter((c) => c !== zipCode && c !== city)
    .join(", ");

  return { street, city, zipCode, additionalAddressInfo: additionalAddressInfo || undefined };
}

function splitPhone(raw: string) {
  const v = String(raw || "").trim().replace(/\s+/g, "");
  if (!v) return { number: "", prefix: null as string | null };
  if (v.startsWith("+") && v.length > 4) {
    const prefix = v.slice(0, 3);
    const number = v.slice(3).replace(/\D/g, "");
    return { number, prefix };
  }
  return { number: v.replace(/\D/g, ""), prefix: null };
}

function normalizePhoneForCountry(raw: string, countryCode: "RO" | "HU") {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return { number: "", prefix: undefined as string | undefined };
  if (countryCode === "RO") {
    let local = digits;
    if (local.startsWith("40")) local = local.slice(2);
    if (local.startsWith("0")) local = local.slice(1);
    local = local.slice(0, 12);
    return { number: local, prefix: local ? "+40" : undefined };
  }
  const parsed = splitPhone(raw);
  return { number: parsed.number, prefix: parsed.prefix || undefined };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

export function isLikelyDpdTrackingNumber(value: unknown): boolean {
  const v = String(value ?? "").replace(/\s+/g, "").trim();
  if (!/^\d{10,14}$/.test(v)) return false;
  if (isUuid(v)) return false;
  return true;
}

function collectPathCandidates(
  input: unknown,
  accept: (value: string, path: string) => boolean,
  path = "$",
  out: Array<{ value: string; path: string }> = []
) {
  if (input == null) return out;
  if (Array.isArray(input)) {
    input.forEach((v, i) => collectPathCandidates(v, accept, `${path}[${i}]`, out));
    return out;
  }
  if (typeof input !== "object") return out;
  const rec = input as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) {
    const p = `${path}.${k}`;
    if (typeof v === "string" || typeof v === "number") {
      const text = String(v).trim();
      if (text && accept(text, p)) out.push({ value: text, path: p });
    } else {
      collectPathCandidates(v, accept, p, out);
    }
  }
  return out;
}

function pickShipmentId(raw: unknown): { value: string; path: string } | null {
  const keys = [".shipmentId", ".id", ".shipments[", ".shipment_id"];
  const candidates = collectPathCandidates(
    raw,
    (v, p) => /^(?:\d+|[a-zA-Z0-9-]+)$/.test(v) && !isLikelyDpdTrackingNumber(v) && keys.some((k) => p.includes(k))
  );
  return candidates[0] || null;
}

function pickTracking(raw: unknown): { value: string; path: string } | null {
  const candidates = collectPathCandidates(
    raw,
    (v, p) =>
      isLikelyDpdTrackingNumber(v) &&
      (p.toLowerCase().includes("parcelnumber") || p.toLowerCase().includes("tracking") || p.toLowerCase().includes("waybill"))
  );
  return candidates[0] || null;
}

function extractShipmentValidationErrors(raw: unknown): Array<{ errorCode?: string; errorContent?: string; numOrder?: unknown }> {
  if (!raw || typeof raw !== "object") return [];
  const rec = raw as Record<string, unknown>;
  const results = Array.isArray(rec.shipmentResults) ? rec.shipmentResults : [];
  const out: Array<{ errorCode?: string; errorContent?: string; numOrder?: unknown }> = [];
  for (const row of results) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const errs = Array.isArray(item.errors) ? item.errors : [];
    for (const e of errs) {
      if (!e || typeof e !== "object") continue;
      const er = e as Record<string, unknown>;
      out.push({
        errorCode: er.errorCode != null ? String(er.errorCode) : undefined,
        errorContent: er.errorContent != null ? String(er.errorContent) : undefined,
        numOrder: item.numOrder,
      });
    }
  }
  return out;
}

function toCodReference(orderNumber: number): string {
  const digits = String(orderNumber).replace(/\D/g, "");
  if (!digits) return String(Date.now()).slice(-10);
  return digits.slice(-10);
}

function formatDateYmdCompact(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function parseInputDate(input: string): Date | null {
  const raw = String(input || "").trim();
  if (!raw) return null;
  if (/^\d{8}$/.test(raw)) {
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(4, 6));
    const d = Number(raw.slice(6, 8));
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mm - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mm - 1 || dt.getDate() !== d) return null;
  return dt;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function normalizePickupDateForDpd(inputDate: string): { ok: true; value: string } | { ok: false; reason: string; raw: unknown } {
  const parsed = parseInputDate(inputDate);
  if (!parsed) {
    return {
      ok: false,
      reason: "dpd_pickup_invalid_pickup_date_format",
      raw: { inputDate, expected: "YYYY-MM-DD or YYYYMMDD" },
    };
  }
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nextDay = addDays(todayLocal, 1);
  const maxDay = addDays(nextDay, 29);
  const parsedLocal = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (parsedLocal < nextDay || parsedLocal > maxDay || isWeekend(parsedLocal)) {
    return {
      ok: false,
      reason: "dpd_pickup_invalid_pickup_date_window",
      raw: {
        inputDate,
        normalized: formatDateYmdCompact(parsedLocal),
        minAllowed: formatDateYmdCompact(nextDay),
        maxAllowed: formatDateYmdCompact(maxDay),
        weekend: isWeekend(parsedLocal),
      },
    };
  }
  return { ok: true, value: formatDateYmdCompact(parsedLocal) };
}

async function dpdRequest<T>(params: {
  operation:
    | "createShipment"
    | "getLabelByShipmentIds"
    | "getLabelByParcelNumbers"
    | "cancelShipment"
    | "createPickup"
    | "cancelPickup"
    | "shipmentInfo";
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpointPath: string,
  body?: Record<string, unknown>,
  apiVersion?: "v1.1" | "v1.0",
  extraHeaders?: Record<string, string>,
}): Promise<DpdGenericResult<T>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  const apiVersion = params.apiVersion || "v1.1";
  const endpoint = resolveEndpoint(cfg.baseUrlRaw, apiVersion, params.endpointPath);
  const res = await fetch(endpoint.finalUrl, {
    method: params.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${cfg.token}`,
      ...(params.extraHeaders || {}),
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });
  const rawText = await res.text().catch(() => "");
  let raw: unknown = {};
  if (rawText) {
    try {
      raw = JSON.parse(rawText);
    } catch {
      raw = rawText.slice(0, 10000);
    }
  }
  const responseMeta = {
    location: res.headers.get("location"),
    pickupIdHeader: res.headers.get("pickupid"),
    correlationId: res.headers.get("x-correlation-id"),
    transactionId: res.headers.get("transactionid"),
    contentType: res.headers.get("content-type"),
  };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    (raw as Record<string, unknown>).__dpdMeta = sanitizeBodySafe(responseMeta);
  }
  const diagnostics = buildDpdAuthDiagnostics({
    operation: params.operation,
    endpointPath: params.endpointPath,
    apiVersion,
    method: params.method,
    requestBodySafe: params.body || null,
    responseStatus: res.status,
    responseTextSafe: rawText ? rawText.slice(0, 10000) : null,
    responseJsonSafe: sanitizeBodySafe(raw),
    responseBodySafe: raw,
    correlationId: res.headers.get("x-correlation-id"),
    transactionId: res.headers.get("transactionid"),
  });
  if (!res.ok) return { ok: false, reason: `dpd_api_http_${res.status}`, raw: { diagnostics, body: sanitizeBodySafe(raw) }, httpStatus: res.status };
  return { ok: true, data: raw as T, raw: sanitizeBodySafe(raw), httpStatus: res.status };
}

export async function createDpdShipment(order: Order, market: Market): Promise<DpdResult> {
  if (!isEnabled()) return { ok: false, reason: "dpd_api_disabled" };
  const cfg = configured();
  if (!cfg.token || !cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  if (order.paymentMethod === "COD" && market === "HU") {
    return { ok: false, reason: "DPD_HU_COD_NOT_ENABLED" };
  }

  const receiverCountry = market === "HU" ? "HU" : "RO";
  const parsed = parseDeliveryAddress(order.deliveryAddress, receiverCountry);
  const phone = normalizePhoneForCountry(order.phone, receiverCountry);
  const currency = market === "HU" ? "HUF" : "RON";
  const endpointPath = "/shipments";
  const codPaymentType = process.env.DPD_API_COD_PAYMENT_TYPE?.trim() || "Cash";
  const parcelRef = `${order.orderNumber}-1`;
  const codReference = order.paymentMethod === "COD" && market === "RO" ? toCodReference(order.orderNumber) : null;

  const receiver: Record<string, unknown> = {
    city: parsed.city || "",
    companyName: order.customerName,
    contactEmail: order.email || undefined,
    contactMobile: phone.number || undefined,
    contactName: order.customerName,
    contactPhone: phone.number || undefined,
    countryCode: receiverCountry,
    name: order.customerName,
    street: parsed.street || "",
    zipCode: parsed.zipCode || "",
    additionalAddressInfo: parsed.additionalAddressInfo,
  };
  const missingReceiver: string[] = [];
  if (!String(receiver.name || "").trim()) missingReceiver.push("receiver.name");
  if (!String(receiver.street || "").trim()) missingReceiver.push("receiver.street");
  if (!String(receiver.city || "").trim()) missingReceiver.push("receiver.city");
  if (!String(receiver.zipCode || "").trim()) missingReceiver.push("receiver.zipCode");
  if (!String(receiver.countryCode || "").trim()) missingReceiver.push("receiver.countryCode");
  if (!String(receiver.contactEmail || "").trim() && !String(receiver.contactPhone || "").trim() && !String(receiver.contactMobile || "").trim()) {
    missingReceiver.push("receiver.contactEmail|contactPhone|contactMobile");
  }

  const shipment: Record<string, unknown> = {
    numOrder: 1,
    senderAddressId: cfg.senderAddressId,
    receiver,
    parcels: [
      {
        reference1: String(order.orderNumber),
        reference2: parcelRef,
        weight: Number(process.env.DPD_API_DEFAULT_WEIGHT_KG || 1),
      },
    ],
    service: {
      mainServiceElementCodes: ["001"],
    },
    reference1: String(order.orderNumber),
    saveMode: "parcel number",
    extendShipmentData: true,
  };
  if (!Array.isArray(shipment.parcels) || shipment.parcels.length === 0) missingReceiver.push("parcels[0]");
  const mainCodes = (shipment.service as Record<string, unknown>)?.mainServiceElementCodes;
  if (!Array.isArray(mainCodes) || mainCodes.length === 0) missingReceiver.push("service.mainServiceElementCodes");
  if (missingReceiver.length > 0) {
    return {
      ok: false,
      reason: "DPD_INVALID_RECEIVER_ADDRESS",
      raw: { missingFields: missingReceiver, parsedAddress: sanitizeBodySafe(parsed) },
      createRequest: null,
      httpStatus: null,
    };
  }

  if (order.paymentMethod === "COD" && market === "RO") {
    (shipment.service as Record<string, unknown>).additionalService = {
      cod: {
        amount: String(order.totalPrice),
        currency,
        paymentType: codPaymentType,
        reference: codReference,
        split: "First parcel",
      },
    };
  }

  const compact = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(compact);
    if (!input || typeof input !== "object") return input;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v === undefined || v === null || v === "") continue;
      out[k] = compact(v);
    }
    return out;
  };

  const payload = compact({
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    shipments: [shipment],
  }) as Record<string, unknown>;

  try {
    const res = await dpdRequest<Record<string, unknown>>({
      operation: "createShipment",
      method: "POST",
      endpointPath,
      body: payload,
      apiVersion: "v1.1",
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: res.reason,
        raw: res.raw,
        httpStatus: res.httpStatus || null,
        createRequest: sanitizeBodySafe({
          actualHttpBodySentToDpd: payload,
          codDiagnostics: codReference
            ? {
                originalOrderNumber: String(order.orderNumber),
                codReferenceUsed: codReference,
                codReferenceRule: "last 10 digits of numeric order number",
              }
            : null,
        }),
      };
    }
    const raw = res.data;
    const shipmentValidationErrors = extractShipmentValidationErrors(raw);
    if (shipmentValidationErrors.length > 0) {
      const message = shipmentValidationErrors
        .map((e) => `${e.errorCode || "UNKNOWN"}:${e.errorContent || "Validation error"}`)
        .join(" | ");
      return {
        ok: false,
        reason: "dpd_api_create_validation_error",
        raw: sanitizeBodySafe({
          message,
          shipmentValidationErrors,
          response: raw,
        }),
        httpStatus: 200,
        createRequest: sanitizeBodySafe({
          actualHttpBodySentToDpd: payload,
          codDiagnostics: codReference
            ? {
                originalOrderNumber: String(order.orderNumber),
                codReferenceUsed: codReference,
                codReferenceRule: "last 10 digits of numeric order number",
              }
            : null,
        }),
      };
    }
    const shipmentId = pickShipmentId(raw);
    if (!shipmentId) {
      return {
        ok: false,
        reason: "dpd_api_missing_shipment_id",
        raw: sanitizeBodySafe(raw),
        httpStatus: 200,
        createRequest: sanitizeBodySafe({
          actualHttpBodySentToDpd: payload,
          codDiagnostics: codReference
            ? {
                originalOrderNumber: String(order.orderNumber),
                codReferenceUsed: codReference,
                codReferenceRule: "last 10 digits of numeric order number",
              }
            : null,
        }),
      };
    }
    const tracking = pickTracking(raw);
    return {
      ok: true,
      shipmentId: shipmentId.value,
      shipmentIdSourcePath: shipmentId.path,
      trackingNumber: tracking?.value || null,
      trackingSourcePath: tracking?.path || null,
      raw: sanitizeBodySafe(raw),
      createRequest: sanitizeBodySafe({
        payload,
        codDiagnostics: codReference
          ? {
              originalOrderNumber: String(order.orderNumber),
              codReferenceUsed: codReference,
              codReferenceRule: "last 10 digits of numeric order number",
            }
          : null,
      }),
      httpStatus: 200,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "dpd_api_request_failed",
      raw: String(error),
      createRequest: sanitizeBodySafe({
        payload,
        codDiagnostics: codReference
          ? {
              originalOrderNumber: String(order.orderNumber),
              codReferenceUsed: codReference,
              codReferenceRule: "last 10 digits of numeric order number",
            }
          : null,
      }),
    };
  }
}

export async function fetchDpdShipmentStatus(
  shipmentId: string
): Promise<DpdGenericResult<{ state: string; trackingNumber: string | null; trackingSourcePath: string | null; raw: unknown }>> {
  void shipmentId;
  return {
    ok: false,
    reason: "dpd_shipment_status_endpoint_not_confirmed_in_docs",
    raw: {
      message: "GET shipment status endpoint is not used because it is not confirmed in bundled DPD Shipping API docs.",
    },
  };
}

export async function cancelDpdShipment(shipmentId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const cfg = configured();
  if (!cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const cleanShipmentId = String(shipmentId || "").trim();
  if (!cleanShipmentId) return { ok: false, reason: "dpd_cancel_missing_shipment_id" };
  return dpdRequest<Record<string, unknown>>({
    operation: "cancelShipment",
    method: "PUT",
    endpointPath: "/shipments/cancellation",
    body: {
      buCode: cfg.buCode,
      customerId: cfg.customerId,
      shipmentIds: [cleanShipmentId],
    },
    apiVersion: "v1.1",
  });
}

export async function fetchDpdLabelPdfForShipments(
  input: string[] | DpdLabelFetchInput
): Promise<DpdGenericResult<{ bytes: Buffer; contentType: string; attempt: DpdEndpointAttempt }>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const shipmentIds = Array.isArray(input) ? input : input.shipmentIds || [];
  const parcelNumbers = Array.isArray(input) ? [] : input.parcelNumbers || [];

  const cleanedParcels = parcelNumbers
    .map((x) => String(x || "").trim())
    .filter(isLikelyDpdTrackingNumber)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));

  const cleanedShipments = shipmentIds
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));
  const byParcel = cleanedParcels.length > 0;
  const endpointPath = byParcel ? "/label/parcel-numbers" : "/label/shipment-ids";
  const payload: Record<string, unknown> = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    labelSize: "A4",
    printFormat: "pdf",
    startPosition: 2,
  };
  if (byParcel) payload.parcelNumberList = cleanedParcels;
  else payload.shipmentIdList = cleanedShipments;

  if (!byParcel && cleanedShipments.length === 0) return { ok: false, reason: "dpd_label_missing_shipment_ids" };
  if (byParcel && cleanedParcels.length === 0) return { ok: false, reason: "dpd_label_missing_parcel_numbers" };

  const extractPdfBufferFromDpdLabelJson = (
    responseText: string
  ): {
    pdfBuffer: Buffer;
    transactionId?: unknown;
    responseJsonSafe: {
      transactionId?: unknown;
      pdfFilePresent: boolean;
      pdfFilePrefix: string | null;
      pdfFileLength: number;
    };
    decodeError?: "missing_pdf_file" | "invalid_pdf_base64";
  } | null => {
    try {
      const json = JSON.parse(responseText) as Record<string, unknown>;
      const container =
        json && typeof json.data === "object" && json.data != null
          ? (json.data as Record<string, unknown>)
          : json;
      const pdfFile = container?.pdfFile;
      if (typeof pdfFile !== "string" || !pdfFile.trim()) {
        return {
          pdfBuffer: Buffer.alloc(0),
          transactionId: container?.transactionId ?? json?.transactionId,
          responseJsonSafe: {
            transactionId: container?.transactionId ?? json?.transactionId,
            pdfFilePresent: false,
            pdfFilePrefix: null,
            pdfFileLength: 0,
          },
          decodeError: "missing_pdf_file",
        };
      }

      const trimmed = pdfFile.trim();
      const expectedPrefix = "data:application/pdf;base64,";
      const hasPrefix = trimmed.startsWith(expectedPrefix);
      const base64 = hasPrefix ? trimmed.slice(expectedPrefix.length) : trimmed;
      const pdfBuffer = Buffer.from(base64, "base64");
      const isPdf = pdfBuffer.length >= 4 && pdfBuffer.subarray(0, 4).toString("utf8") === "%PDF";
      const responseJsonSafe = {
        transactionId: json?.transactionId,
        pdfFilePresent: true,
        pdfFilePrefix: hasPrefix ? expectedPrefix : null,
        pdfFileLength: trimmed.length,
      };
      if (!isPdf) {
        return {
          pdfBuffer,
          transactionId: container?.transactionId ?? json?.transactionId,
          responseJsonSafe,
          decodeError: "invalid_pdf_base64",
        };
      }
      return {
        pdfBuffer,
        transactionId: container?.transactionId ?? json?.transactionId,
        responseJsonSafe,
      };
    } catch {
      return null;
    }
  };

  const endpoint = resolveEndpoint(cfg.baseUrlRaw, "v1.0", endpointPath);
  const started = Date.now();
  const step = byParcel ? "label_parcel_numbers" : cleanedShipments.length > 1 ? "label_bulk_shipment_ids" : "label_single_shipment_id";
  const res = await fetch(endpoint.finalUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.token}`,
    },
    body: JSON.stringify(payload),
  });
  const bytes = Buffer.from(await res.arrayBuffer());
  const responseTextFull = bytes.length ? bytes.toString("utf8") : "";
  const responseTextSafe = responseTextFull ? responseTextFull.slice(0, 10000) : null;
  const looksLikePdf = bytes.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF";
  const parsedJson = responseTextFull ? extractPdfBufferFromDpdLabelJson(responseTextFull) : null;
  const attempt: DpdEndpointAttempt = {
    step,
    method: "POST",
    url: endpoint.finalUrl,
    status: res.status,
    contentType: res.headers.get("content-type"),
    contentLength: res.headers.get("content-length"),
    durationMs: Date.now() - started,
    looksLikePdf,
    requestBodySafe: sanitizeBodySafe(payload),
    responseTextSafe: parsedJson ? null : responseTextSafe,
    responseJsonSafe: parsedJson?.responseJsonSafe,
    responseWasJsonWrapper: Boolean(parsedJson && !parsedJson.decodeError),
    transactionId: parsedJson?.transactionId,
  };
  if (!res.ok) {
    return {
      ok: false,
      reason: `dpd_api_http_${res.status}`,
      raw: {
        attempt,
        dpdError: responseTextSafe,
      },
      httpStatus: res.status,
    };
  }
  if (looksLikePdf) {
    return { ok: true, data: { bytes, contentType: "application/pdf", attempt } };
  }

  if (parsedJson && !parsedJson.decodeError) {
    const wrappedAttempt: DpdEndpointAttempt = {
      ...attempt,
      looksLikePdf: true,
      responseWasJsonWrapper: true,
      transactionId: parsedJson.transactionId,
      responseJsonSafe: parsedJson.responseJsonSafe,
    };
    return { ok: true, data: { bytes: parsedJson.pdfBuffer, contentType: "application/pdf", attempt: wrappedAttempt } };
  }

  if (parsedJson?.decodeError === "missing_pdf_file") {
    return {
      ok: false,
      reason: "dpd_label_not_pdf",
      raw: {
        attempt: {
          ...attempt,
          error: "DPD label response did not contain pdfFile.",
        },
      },
      httpStatus: res.status,
    };
  }

  if (parsedJson?.decodeError === "invalid_pdf_base64") {
    return {
      ok: false,
      reason: "dpd_label_not_pdf",
      raw: {
        attempt: {
          ...attempt,
          error: "DPD label pdfFile could not be decoded into a valid PDF.",
        },
      },
      httpStatus: res.status,
    };
  }

  return {
    ok: false,
    reason: "dpd_label_not_pdf",
    raw: {
      attempt,
    },
    httpStatus: res.status,
  };
}

export async function createDpdPickup(
  market: Market,
  input: DpdPickupInput
): Promise<DpdGenericResult<{ pickupId: string; pickupDate: string | null; raw: unknown; request: unknown }>> {
  void market;
  const cfg = configured();
  if (!cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  const contactEmail = String(input.contactEmail || process.env.DPD_API_CONTACT_EMAIL || "").trim();
  if (!contactEmail) {
    return {
      ok: false,
      reason: "dpd_pickup_missing_contact_email",
      raw: {
        message: "DPD pickup requires contactEmail.",
      },
    };
  }
  const pickupDateNorm = normalizePickupDateForDpd(input.pickupDate);
  if (!pickupDateNorm.ok) {
    return {
      ok: false,
      reason: pickupDateNorm.reason,
      raw: pickupDateNorm.raw,
    };
  }
  const senderAddressIdNum = Number(cfg.senderAddressId);
  const shipmentIds = (input.shipmentIds || [])
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0)
    .map((x) => Math.trunc(x));
  const hasShipmentIds = shipmentIds.length > 0;
  const pickupOrder: Record<string, unknown> = {
    additionalInfo: String(input.note || "Svoz zasilek z e-shopu").slice(0, 300),
    contactName: input.contactName,
    contactPhone: splitPhone(input.phone).number,
    contactEmail,
    parcelCount: Math.max(1, Math.floor(input.parcelCount || 1)),
    pickupDate: pickupDateNorm.value,
    shipmentIds,
    totalWeight: Math.max(0.1, Number(input.totalWeight || 1)),
  };
  if (!hasShipmentIds) {
    pickupOrder.internalPickupAddressId = Number.isFinite(senderAddressIdNum)
      ? senderAddressIdNum
      : cfg.senderAddressId;
  }
  const body = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    pickupOrder,
  };
  const res = await dpdRequest<Record<string, unknown>>({
    operation: "createPickup",
    method: "POST",
    endpointPath: "/pickup",
    body,
    apiVersion: "v1.1",
  });
  if (!res.ok) return res;
  const rawAny = res.data as unknown;
  const raw = (rawAny && typeof rawAny === "object" && !Array.isArray(rawAny) ? rawAny : {}) as Record<string, unknown>;
  const responseStatus = res.httpStatus ?? 200;
  const responseTextSafe = typeof rawAny === "string" ? rawAny.slice(0, 10000) : JSON.stringify(sanitizeBodySafe(rawAny)).slice(0, 10000);
  const responseJsonSafe = sanitizeBodySafe(rawAny);
  const rawPrimitiveId =
    typeof rawAny === "string" || typeof rawAny === "number" ? String(rawAny).trim() : "";
  const meta = (raw.__dpdMeta && typeof raw.__dpdMeta === "object"
    ? (raw.__dpdMeta as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const locationHeader = String(meta.location || "").trim();
  const locationId = locationHeader ? locationHeader.split("/").filter(Boolean).pop() || "" : "";
  const pickupIdHeader = String(meta.pickupIdHeader || "").trim();
  const pickupIdCandidate = collectPathCandidates(
    raw,
    (value, path) => {
      const p = path.toLowerCase();
      if (!/^[a-z0-9-]{4,}$/i.test(value)) return false;
      // Prefer explicit pickup id fields in any wrapper shape.
      // DPD docs for cancel endpoint reference `/pickup/cancel/{id}` where
      // `{id}` is the identifier returned by pickup creation.
      const looksLikeIdField =
        p.endsWith(".pickupid") ||
        p.endsWith(".pickup_id") ||
        p.endsWith(".id");
      if (!looksLikeIdField) return false;
      // Avoid unrelated ids from headers/diagnostics blocks if present.
      if (p.includes("transaction") || p.includes("correlation") || p.includes("customerid")) return false;
      if (p.includes("order")) return false;
      return true;
    }
  )[0];
  const pickupIdFromJson =
    raw.id ??
    raw.pickupId ??
    raw.pickupOrderId ??
    ((raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>).id : undefined) as unknown) ??
    ((raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>).pickupId : undefined) as unknown) ??
    ((raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>).pickupOrderId : undefined) as unknown);
  const pickupId = String(
    pickupIdFromJson || pickupIdCandidate?.value || pickupIdHeader || locationId || rawPrimitiveId || ""
  ).trim();
  if (!pickupId) {
    return {
      ok: false,
      reason: "dpd_pickup_response_missing_id_mapping",
      raw: sanitizeBodySafe({
        operation: "createPickup",
        method: "POST",
        url: dpdUrl("v1.1", "/pickup", cfg.baseUrlRaw),
        requestBodySafe: body,
        responseStatus,
        responseTextSafe,
        responseJsonSafe,
        parsedPickupId: null,
        message:
          "DPD pickup was created or accepted, but app could not find pickup id in response. Check rawPickupResponse mapping.",
        response: rawAny,
        responseMeta: meta,
        availableTopLevelKeys: Object.keys(raw || {}),
        rawPickupResponse: rawAny,
      }),
    };
  }
  const pickupDateCandidate = collectPathCandidates(
    raw,
    (value, path) => /pickupdate$/i.test(path) && /^\d{8}$/.test(value)
  )[0];
  return {
    ok: true,
    data: {
      pickupId,
      pickupDate: String(pickupDateCandidate?.value || raw.pickupDate || body.pickupOrder.pickupDate || "") || null,
      raw: sanitizeBodySafe({
        operation: "createPickup",
        method: "POST",
        url: dpdUrl("v1.1", "/pickup", cfg.baseUrlRaw),
        requestBodySafe: body,
        responseStatus,
        responseTextSafe,
        responseJsonSafe,
        parsedPickupId: pickupId,
        rawPickupResponse: rawAny,
      }),
      request: sanitizeBodySafe(body),
    },
  };
}

export async function cancelDpdPickup(pickupId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const cfg = configured();
  if (!cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const cleanPickupId = String(pickupId || "").trim();
  if (!cleanPickupId) return { ok: false, reason: "dpd_pickup_cancel_missing_id" };
  const body = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
  };
  const res = await dpdRequest<Record<string, unknown>>({
    operation: "cancelPickup",
    method: "PUT",
    endpointPath: `/pickup/cancel/${encodeURIComponent(cleanPickupId)}`,
    body,
    apiVersion: "v1.1",
  });
  if (!res.ok) {
    return {
      ...res,
      raw: sanitizeBodySafe({
        operation: "cancelPickup",
        method: "PUT",
        url: dpdUrl("v1.1", `/pickup/cancel/${encodeURIComponent(cleanPickupId)}`, cfg.baseUrlRaw),
        requestBodySafe: body,
        responseStatus: res.httpStatus ?? null,
        responseTextSafe: JSON.stringify(sanitizeBodySafe(res.raw)).slice(0, 10000),
        responseJsonSafe: sanitizeBodySafe(res.raw),
      }),
    };
  }
  return {
    ...res,
    raw: sanitizeBodySafe({
      operation: "cancelPickup",
      method: "PUT",
      url: dpdUrl("v1.1", `/pickup/cancel/${encodeURIComponent(cleanPickupId)}`, cfg.baseUrlRaw),
      requestBodySafe: body,
      responseStatus: res.httpStatus ?? null,
      responseTextSafe: JSON.stringify(sanitizeBodySafe(res.data)).slice(0, 10000),
      responseJsonSafe: sanitizeBodySafe(res.data),
    }),
  };
}
