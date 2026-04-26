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
  const diagnostics = buildDpdAuthDiagnostics({
    operation: params.operation,
    endpointPath: params.endpointPath,
    apiVersion,
    method: params.method,
    requestBodySafe: params.body || null,
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
    return { ok: false, reason: "DPD_HU_COD_NOT_ENABLED" };
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
  const senderAddressIdNum = Number(cfg.senderAddressId);
  const body = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    pickupOrder: {
      contactName: input.contactName,
      contactPhone: splitPhone(input.phone).number,
      contactEmail: process.env.DPD_API_CONTACT_EMAIL?.trim() || undefined,
      internalPickupAddressId: Number.isFinite(senderAddressIdNum) ? senderAddressIdNum : cfg.senderAddressId,
      pickupDate: input.pickupDate,
      parcelCount: Math.max(1, Math.floor(input.parcelCount || 1)),
      totalWeight: Math.max(0.1, Number(input.totalWeight || 1)),
      additionalInfo: String(input.note || "").slice(0, 300) || undefined,
    },
  };
  const res = await dpdRequest<Record<string, unknown>>({
    operation: "createPickup",
    method: "POST",
    endpointPath: "/pickup",
    body,
    apiVersion: "v1.1",
  });
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
  const cleanPickupId = String(pickupId || "").trim();
  if (!cleanPickupId) return { ok: false, reason: "dpd_pickup_cancel_missing_id" };
  return dpdRequest<Record<string, unknown>>({
    operation: "cancelPickup",
    method: "PUT",
    endpointPath: `/pickup/cancel/${encodeURIComponent(cleanPickupId)}`,
    body: {
      buCode: cfg.buCode,
      customerId: cfg.customerId,
    },
    apiVersion: "v1.1",
  });
}
