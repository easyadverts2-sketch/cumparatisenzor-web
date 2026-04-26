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

type DpdGenericResult<T> = { ok: true; data: T } | { ok: false; reason: string; raw?: unknown; httpStatus?: number | null };

export type DpdAuthDiagnostics = {
  tokenPresent: boolean;
  tokenLength: number;
  tokenLooksLikeJwt: boolean;
  tokenHasWhitespaceAtEdges: boolean;
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
  responseStatus: number | null;
  responseBodySafe?: unknown;
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
};

export type DpdPickupInput = {
  pickupDate: string;
  fromTime: string;
  toTime: string;
  contactName: string;
  phone: string;
  note?: string;
  parcelCount: number;
  totalWeight: number;
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
  endpointPath: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  responseStatus?: number | null;
  responseBodySafe?: unknown;
  correlationId?: string | null;
  transactionId?: string | null;
  apiVersion?: "v1.1" | "v1.0";
}): DpdAuthDiagnostics {
  const cfg = configured();
  const tokenRaw = String(cfg.tokenRaw || "");
  const token = String(cfg.token || "");
  const endpoint = resolveEndpoint(cfg.baseUrlRaw, params.apiVersion || "v1.1", params.endpointPath);
  return {
    tokenPresent: token.length > 0,
    tokenLength: token.length,
    tokenLooksLikeJwt: tokenLooksLikeJwt(cfg.token),
    tokenHasWhitespaceAtEdges: tokenRaw.length > 0 && tokenRaw !== tokenRaw.trim(),
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
    responseStatus: params.responseStatus ?? null,
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

function parseDeliveryAddress(deliveryAddress: string) {
  const text = String(deliveryAddress || "").replace(/\n+/g, ", ");
  const chunks = text
    .split(",")
    .map((chunk) => normalizeAscii(chunk))
    .filter(Boolean);
  const street = chunks[0] || "";
  const zipMatch = normalizeAscii(text).match(/\b(\d{6})\b/);
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

function toCodReference(orderNumber: number): string {
  const digits = String(orderNumber).replace(/\D/g, "");
  if (!digits) return String(Date.now()).slice(-10);
  return digits.slice(-10);
}

async function dpdJsonRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpointPath: string,
  body?: Record<string, unknown>,
  apiVersion: "v1.1" | "v1.0" = "v1.1"
): Promise<DpdGenericResult<T>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  const endpoint = resolveEndpoint(cfg.baseUrlRaw, apiVersion, endpointPath);
  const res = await fetch(endpoint.finalUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${cfg.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.json().catch(() => ({}));
  const diagnostics = buildDpdAuthDiagnostics({
    endpointPath,
    apiVersion,
    method,
    responseStatus: res.status,
    responseBodySafe: raw,
    correlationId: res.headers.get("x-correlation-id"),
    transactionId: res.headers.get("transactionid"),
  });
  if (!res.ok) return { ok: false, reason: `dpd_api_http_${res.status}`, raw: { diagnostics, body: sanitizeBodySafe(raw) }, httpStatus: res.status };
  return { ok: true, data: raw as T };
}

export async function createDpdShipment(order: Order, market: Market): Promise<DpdResult> {
  if (!isEnabled()) return { ok: false, reason: "dpd_api_disabled" };
  const cfg = configured();
  if (!cfg.token || !cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  if (order.paymentMethod === "COD" && market === "HU") {
    return { ok: false, reason: "dpd_cod_not_allowed_hu" };
  }

  const parsed = parseDeliveryAddress(order.deliveryAddress);
  const phone = normalizePhoneForCountry(order.phone, market === "HU" ? "HU" : "RO");
  const receiverCountry = market === "HU" ? "HU" : "RO";
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
    contactPhonePrefix: phone.prefix || undefined,
    countryCode: receiverCountry,
    name: order.customerName,
    name2: undefined,
    street: parsed.street || "N/A",
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
    saveMode: "printed",
    printFormat: "PDF",
    labelSize: "A4",
    extendShipmentData: true,
    printRef1AsBarcode: false,
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
    const endpoint = resolveEndpoint(cfg.baseUrlRaw, "v1.1", endpointPath);
    const res = await fetch(endpoint.finalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify(payload),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        reason: `dpd_api_http_${res.status}`,
        raw: {
          diagnostics: buildDpdAuthDiagnostics({
            endpointPath,
            apiVersion: "v1.1",
            method: "POST",
            responseStatus: res.status,
            responseBodySafe: raw,
            correlationId: res.headers.get("x-correlation-id"),
            transactionId: res.headers.get("transactionid"),
          }),
          body: sanitizeBodySafe(raw),
        },
        httpStatus: res.status,
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
    const shipmentId = pickShipmentId(raw);
    if (!shipmentId) {
      return {
        ok: false,
        reason: "dpd_api_missing_shipment_id",
        raw: sanitizeBodySafe(raw),
        httpStatus: res.status,
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
      httpStatus: res.status,
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
  const endpointPath = `/shipments/${encodeURIComponent(shipmentId)}`;
  const res = await dpdJsonRequest<Record<string, unknown>>("GET", endpointPath, undefined, "v1.1");
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown>;
  const state = String(raw.status || raw.state || "").toUpperCase();
  const tracking = pickTracking(raw);
  return { ok: true, data: { state, trackingNumber: tracking?.value || null, trackingSourcePath: tracking?.path || null, raw: sanitizeBodySafe(raw) } };
}

export async function cancelDpdShipment(shipmentId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const cfg = configured();
  if (!cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  // DPD docs endpoint: /v1.1/shipments/cancellation
  return dpdJsonRequest<Record<string, unknown>>(
    "PUT",
    "/shipments/cancellation",
    {
      buCode: cfg.buCode,
      customerId: cfg.customerId,
      shipmentIdList: [shipmentId],
    },
    "v1.1"
  );
}

export async function fetchDpdLabelPdfForShipments(
  input: string[] | DpdLabelFetchInput
): Promise<DpdGenericResult<{ bytes: Buffer; contentType: string; attempt: DpdEndpointAttempt }>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const shipmentIds = Array.isArray(input) ? input : input.shipmentIds || [];
  const parcelNumbers = Array.isArray(input) ? [] : input.parcelNumbers || [];

  const cleanedParcels = parcelNumbers.map((x) => String(x || "").trim()).filter(isLikelyDpdTrackingNumber);
  const cleanedShipments = shipmentIds.map((x) => String(x || "").trim()).filter(Boolean);
  const byParcel = cleanedParcels.length > 0;
  const endpointPath = byParcel ? "/label/parcel-numbers" : "/label/shipment-ids";
  const payload: Record<string, unknown> = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    labelSize: "A4",
    startPosition: 1,
    printFormat: "PDF",
  };
  if (byParcel) payload.parcelNumberList = cleanedParcels;
  else payload.shipmentIdList = cleanedShipments;

  if (!byParcel && cleanedShipments.length === 0) return { ok: false, reason: "dpd_label_missing_shipment_ids" };
  if (byParcel && cleanedParcels.length === 0) return { ok: false, reason: "dpd_label_missing_parcel_numbers" };

  const endpoint = resolveEndpoint(cfg.baseUrlRaw, "v1.0", endpointPath);
  const started = Date.now();
  const res = await fetch(endpoint.finalUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get("content-type");
  const contentLength = res.headers.get("content-length");
  const bytes = Buffer.from(await res.arrayBuffer().catch(() => new ArrayBuffer(0)));
  const looksLikePdf =
    String(contentType || "").toLowerCase().includes("application/pdf") ||
    (bytes.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF");
  const attempt: DpdEndpointAttempt = {
    step: byParcel ? "label_parcel_numbers" : cleanedShipments.length > 1 ? "label_bulk_shipment_ids" : "label_single_shipment_id",
    method: "POST",
    url: endpoint.finalUrl,
    status: res.status,
    contentType,
    contentLength,
    durationMs: Date.now() - started,
    looksLikePdf,
  };
  if (!res.ok || !looksLikePdf || bytes.length === 0) {
    return { ok: false, reason: !res.ok ? `dpd_api_http_${res.status}` : "dpd_label_not_pdf", raw: attempt, httpStatus: res.status };
  }
  return { ok: true, data: { bytes, contentType: contentType || "application/pdf", attempt } };
}

export async function createDpdPickup(
  market: Market,
  input: DpdPickupInput
): Promise<DpdGenericResult<{ pickupId: string; pickupDate: string | null; raw: unknown; request: unknown }>> {
  const cfg = configured();
  if (!cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  const senderAddressIdNum = Number(cfg.senderAddressId);
  const body = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    pickupOrder: {
      contactName: input.contactName,
      contactPhone: splitPhone(input.phone).number,
      contactPhonePrefix: splitPhone(input.phone).prefix || undefined,
      contactEmail: process.env.DPD_API_CONTACT_EMAIL?.trim() || undefined,
      internalPickupAddressId: Number.isFinite(senderAddressIdNum) ? senderAddressIdNum : cfg.senderAddressId,
      pickupDate: input.pickupDate,
      fromTime: input.fromTime,
      toTime: input.toTime,
      parcelCount: Math.max(1, Math.floor(input.parcelCount || 1)),
      totalWeight: Math.max(0.1, Number(input.totalWeight || 1)),
      additionalInfo: String(input.note || "").slice(0, 300) || undefined,
      market,
    },
  };
  const res = await dpdJsonRequest<Record<string, unknown>>("POST", "/pickup", body, "v1.1");
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown>;
  const pickupId = String(raw.pickupId || raw.id || raw.orderId || "").trim();
  if (!pickupId) return { ok: false, reason: "dpd_pickup_missing_id", raw: sanitizeBodySafe(raw) };
  return {
    ok: true,
    data: { pickupId, pickupDate: String(raw.pickupDate || body.pickupOrder.pickupDate || "") || null, raw: sanitizeBodySafe(raw), request: sanitizeBodySafe(body) },
  };
}

export async function cancelDpdPickup(pickupId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const cfg = configured();
  if (!cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const path = `/pickup/cancel/${encodeURIComponent(pickupId)}`;
  return dpdJsonRequest<Record<string, unknown>>(
    "PUT",
    path,
    {
      buCode: cfg.buCode,
      customerId: cfg.customerId,
    },
    "v1.1"
  );
}
