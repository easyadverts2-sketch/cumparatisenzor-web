import type { Market, Order } from "./types";

type DpdResult =
  | {
      ok: true;
      shipmentId: string;
      trackingNumber: string | null;
      raw?: unknown;
      createRequest?: unknown;
      httpStatus?: number | null;
    }
  | { ok: false; reason: string; raw?: unknown; httpStatus?: number | null; createRequest?: unknown };

type DpdGenericResult<T> = { ok: true; data: T } | { ok: false; reason: string; raw?: unknown; httpStatus?: number | null };

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

function isEnabled() {
  return process.env.DPD_API_ENABLED === "true";
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

function configured() {
  const baseUrl = process.env.DPD_API_BASE_URL?.trim() || "https://shipping.dpdgroup.com/api";
  const token = process.env.DPD_API_TOKEN?.trim();
  const customerId = process.env.DPD_API_CUSTOMER_ID?.trim();
  const senderAddressId = process.env.DPD_API_SENDER_ADDRESS_ID?.trim();
  const buCode = process.env.DPD_API_BU_CODE?.trim() || "015";
  return { baseUrl, token, customerId, senderAddressId, buCode };
}

function parseDeliveryAddress(deliveryAddress: string) {
  const lines = deliveryAddress
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const mainLine = lines.find((line) => line.includes(",")) || "";
  const chunks = mainLine.split(",").map((chunk) => chunk.trim());
  const street = chunks[0] || "";
  const city = chunks[1] || "";
  const zipRaw = chunks[2] || "";
  const zipCode = zipRaw.replace(/[^\d]/g, "");
  return { street, city, zipCode };
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

function pickShipmentId(raw: unknown): string | null {
  const stack: unknown[] = [raw];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    const rec = current as Record<string, unknown>;
    const idCandidate =
      rec.shipmentId ??
      rec.shipment_id ??
      rec.id ??
      rec.parcelLabelNumber ??
      rec.parcelNumber ??
      rec.reference1 ??
      null;
    if (idCandidate != null) {
      const id = String(idCandidate).trim();
      if (id) return id;
    }
    for (const value of Object.values(rec)) {
      if (Array.isArray(value)) value.forEach((v) => stack.push(v));
      else if (value && typeof value === "object") stack.push(value);
    }
  }
  return null;
}

function pickTrackingNumber(raw: unknown): string | null {
  const stack: unknown[] = [raw];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    const rec = current as Record<string, unknown>;
    const candidates = [
      rec.parcelLabelNumber,
      rec.parcelNumber,
      rec.trackingNumber,
      rec.waybill,
      rec.awb,
    ];
    for (const candidate of candidates) {
      const text = String(candidate ?? "").trim();
      if (isLikelyDpdTrackingNumber(text)) return text;
    }
    for (const value of Object.values(rec)) {
      if (Array.isArray(value)) value.forEach((v) => stack.push(v));
      else if (value && typeof value === "object") stack.push(value);
    }
  }
  return null;
}

async function dpdJsonRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: Record<string, unknown>
): Promise<DpdGenericResult<T>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  const res = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: `dpd_api_http_${res.status}`, raw, httpStatus: res.status };
  return { ok: true, data: raw as T };
}

export async function createDpdShipment(order: Order, market: Market): Promise<DpdResult> {
  if (!isEnabled()) return { ok: false, reason: "dpd_api_disabled" };
  const { baseUrl, token, customerId, senderAddressId, buCode } = configured();
  if (!token || !customerId || !senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  if (order.paymentMethod === "COD" && market === "HU") return { ok: false, reason: "dpd_cod_not_allowed_hu" };

  const parsed = parseDeliveryAddress(order.deliveryAddress);
  const receiverCountry = market === "HU" ? "HU" : "RO";
  const currency = market === "HU" ? "HUF" : "RON";
  const createPath = process.env.DPD_API_CREATE_SHIPMENT_PATH?.trim() || "/v1.1/shipments";
  const codPaymentType = process.env.DPD_API_COD_PAYMENT_TYPE?.trim() || "Cash";

  const shipment: Record<string, unknown> = {
    numOrder: 1,
    senderAddressId,
    receiver: {
      city: parsed.city,
      companyName: order.customerName,
      contactEmail: order.email,
      contactMobile: order.phone,
      contactName: order.customerName,
      contactPhone: order.phone,
      countryCode: receiverCountry,
      name: order.customerName,
      street: parsed.street,
      zipCode: parsed.zipCode,
    },
    parcels: [
      {
        weight: Number(process.env.DPD_API_DEFAULT_WEIGHT_KG || 1),
        reference1: `ORDER-${String(order.orderNumber)}`,
      },
    ],
    service: {
      additionalService: {
        predicts: [
          { destination: order.phone, type: "SMS" },
          { destination: order.email, type: "email" },
        ],
      },
      mainServiceElementCodes: ["001", "013"],
    },
    reference1: String(order.orderNumber),
    saveMode: process.env.DPD_API_SAVE_MODE?.trim() || "final",
  };

  if (order.paymentMethod === "COD") {
    (shipment.service as Record<string, unknown>).additionalService = {
      ...((shipment.service as Record<string, unknown>).additionalService as Record<string, unknown>),
      cod: {
        amount: String(order.totalPrice),
        currency,
        paymentType: codPaymentType,
        reference: String(order.orderNumber),
        split: "Even",
      },
    };
  }

  const payload = { buCode, customerId, shipments: [shipment] };
  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}${createPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: `dpd_api_http_${res.status}`, raw, httpStatus: res.status, createRequest: payload };
    const shipmentId = pickShipmentId(raw);
    if (!shipmentId) return { ok: false, reason: "dpd_api_missing_shipment_id", raw, httpStatus: res.status, createRequest: payload };
    return {
      ok: true,
      shipmentId,
      trackingNumber: pickTrackingNumber(raw),
      raw,
      createRequest: payload,
      httpStatus: res.status,
    };
  } catch (error) {
    return { ok: false, reason: "dpd_api_request_failed", raw: String(error), createRequest: payload };
  }
}

export async function fetchDpdShipmentStatus(
  shipmentId: string
): Promise<DpdGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const path = (process.env.DPD_API_TRACK_PATH?.trim() || "/v1.1/shipments/{id}").replace("{id}", encodeURIComponent(shipmentId));
  const res = await dpdJsonRequest<Record<string, unknown>>("GET", path);
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown>;
  const state = String(raw.status || raw.state || "").toUpperCase();
  const trackingNumber = pickTrackingNumber(raw);
  return { ok: true, data: { state, trackingNumber, raw } };
}

export async function cancelDpdShipment(shipmentId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const cfg = configured();
  if (!cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const path = process.env.DPD_API_CANCEL_PATH?.trim() || "/v1.1/shipments/cancellation";
  return dpdJsonRequest<Record<string, unknown>>("PUT", path, {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    shipmentIdList: [Number(shipmentId)],
  });
}

export async function fetchDpdLabelPdfForShipments(
  shipmentIds: string[]
): Promise<DpdGenericResult<{ bytes: Buffer; contentType: string; attempt: DpdEndpointAttempt }>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const endpoint = process.env.DPD_API_LABEL_PATH?.trim() || "/v1.0/label/shipment-ids";
  const payload = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    labelSize: process.env.DPD_API_LABEL_SIZE?.trim() || "A6",
    printFormat: "pdf",
    shipmentIdList: shipmentIds.map((s) => Number(s)).filter((n) => Number.isFinite(n)),
  };
  if (payload.shipmentIdList.length === 0) return { ok: false, reason: "dpd_label_missing_shipment_ids" };
  const url = `${normalizeBaseUrl(cfg.baseUrl)}${endpoint}`;
  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get("content-type");
  const contentLength = res.headers.get("content-length");
  const bytes = Buffer.from(await res.arrayBuffer().catch(() => new ArrayBuffer(0)));
  const looksLikePdf = String(contentType || "").toLowerCase().includes("application/pdf") || (bytes.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF");
  const attempt: DpdEndpointAttempt = {
    step: shipmentIds.length > 1 ? "label_bulk_shipment_ids" : "label_single_shipment_id",
    method: "POST",
    url,
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
  const path = process.env.DPD_API_PICKUP_PATH?.trim() || "/v1.1/pickup";
  const body = {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    senderAddressId: cfg.senderAddressId,
    market,
    pickupDate: input.pickupDate,
    fromTime: input.fromTime,
    toTime: input.toTime,
    contactName: input.contactName,
    contactPhone: input.phone,
    additionalInfo: String(input.note || "").slice(0, 300),
    parcelCount: Math.max(1, Math.floor(input.parcelCount || 1)),
    totalWeight: Math.max(0.1, Number(input.totalWeight || 1)),
  };
  const res = await dpdJsonRequest<Record<string, unknown>>("POST", path, body);
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown>;
  const pickupId = String(raw.pickupId || raw.id || raw.orderId || "").trim();
  if (!pickupId) return { ok: false, reason: "dpd_pickup_missing_id", raw };
  return { ok: true, data: { pickupId, pickupDate: String(raw.pickupDate || body.pickupDate || "") || null, raw, request: body } };
}

export async function cancelDpdPickup(pickupId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const cfg = configured();
  if (!cfg.customerId) return { ok: false, reason: "dpd_api_not_configured" };
  const path = "/v1.1/pickup/cancel/{id}".replace("{id}", encodeURIComponent(pickupId));
  return dpdJsonRequest<Record<string, unknown>>("PUT", path, {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
  });
}
