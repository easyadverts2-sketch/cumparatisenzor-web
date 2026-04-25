import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Market, Order } from "./types";

type DpdResult =
  | { ok: true; shipmentId: string; labelPublicPath?: string | null; raw?: unknown }
  | { ok: false; reason: string; raw?: unknown };

type DpdGenericResult<T> = { ok: true; data: T } | { ok: false; reason: string; raw?: unknown };

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

async function downloadAndSaveLabelPdf(params: {
  labelBytes: Buffer;
  orderNumber: number;
  market: Market;
  shipmentId: string;
}): Promise<string | null> {
  const relDir = process.env.DPD_LABEL_SAVE_DIR?.trim() || "public/dpd-labels";
  const absDir = path.resolve(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const fileName = `${params.market.toLowerCase()}-${String(params.orderNumber)}-${params.shipmentId}.pdf`;
  const absPath = path.join(absDir, fileName);
  await writeFile(absPath, params.labelBytes);

  if (relDir.startsWith("public/")) {
    const publicPrefix = relDir.replace(/^public\//, "");
    return `/${publicPrefix}/${fileName}`;
  }
  return null;
}

async function downloadAndSaveBulkLabelPdf(params: {
  labelBytes: Buffer;
  market: Market;
  suffix: string;
}): Promise<string | null> {
  const relDir = process.env.DPD_LABEL_SAVE_DIR?.trim() || "public/dpd-labels";
  const absDir = path.resolve(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const fileName = `${params.market.toLowerCase()}-bulk-${params.suffix}.pdf`;
  const absPath = path.join(absDir, fileName);
  await writeFile(absPath, params.labelBytes);
  if (relDir.startsWith("public/")) {
    const publicPrefix = relDir.replace(/^public\//, "");
    return `/${publicPrefix}/${fileName}`;
  }
  return null;
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
      rec.reference1;
    if (idCandidate != null && String(idCandidate).trim() !== "") {
      return String(idCandidate).trim();
    }
    for (const value of Object.values(rec)) {
      if (Array.isArray(value)) {
        for (const nested of value) stack.push(nested);
      } else if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }
  return null;
}

async function fetchLabelPdf(baseUrl: string, token: string, shipmentId: string) {
  const labelUrl = process.env.DPD_API_LABEL_PATH?.trim() || "/v1.0/label/shipment-ids";
  const payload = {
    buCode: process.env.DPD_API_BU_CODE?.trim() || "015",
    customerId: process.env.DPD_API_CUSTOMER_ID?.trim() || "",
    labelSize: process.env.DPD_API_LABEL_SIZE?.trim() || "A6",
    printFormat: "pdf",
    shipmentIdList: [Number(shipmentId)],
  };

  const res = await fetch(`${normalizeBaseUrl(baseUrl)}${labelUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength === 0) return null;
  return bytes;
}

async function fetchBulkLabelPdf(baseUrl: string, token: string, shipmentIds: string[]) {
  const labelUrl = process.env.DPD_API_LABEL_PATH?.trim() || "/v1.0/label/shipment-ids";
  const payload = {
    buCode: process.env.DPD_API_BU_CODE?.trim() || "015",
    customerId: process.env.DPD_API_CUSTOMER_ID?.trim() || "",
    labelSize: process.env.DPD_API_LABEL_SIZE?.trim() || "A6",
    printFormat: "pdf",
    shipmentIdList: shipmentIds.map((s) => Number(s)).filter((n) => Number.isFinite(n)),
  };
  if (payload.shipmentIdList.length === 0) return null;
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}${labelUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength === 0) return null;
  return bytes;
}

async function dpdJsonRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>
): Promise<DpdGenericResult<T>> {
  const cfg = configured();
  if (!cfg.token || !cfg.customerId || !cfg.senderAddressId) {
    return { ok: false, reason: "dpd_api_not_configured" };
  }
  const res = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: `dpd_api_http_${res.status}`, raw };
  return { ok: true, data: raw as T };
}

export async function createDpdShipment(order: Order, market: Market): Promise<DpdResult> {
  if (!isEnabled()) return { ok: false, reason: "dpd_api_disabled" };
  const { baseUrl, token, customerId, senderAddressId, buCode } = configured();

  if (!token || !customerId || !senderAddressId) {
    return { ok: false, reason: "dpd_api_not_configured" };
  }
  if (order.paymentMethod === "COD" && market === "HU") {
    return { ok: false, reason: "dpd_cod_not_allowed_hu" };
  }

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

  const payload = {
    buCode,
    customerId,
    shipments: [shipment],
  };

  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}${createPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, reason: `dpd_api_http_${res.status}`, raw };
    }

    const shipmentId = pickShipmentId(raw);
    if (!shipmentId) {
      return { ok: false, reason: "dpd_api_missing_shipment_id", raw };
    }

    const labelBytes = await fetchLabelPdf(baseUrl, token, shipmentId).catch(() => null);
    const labelPublicPath = labelBytes
      ? await downloadAndSaveLabelPdf({
          labelBytes,
          orderNumber: order.orderNumber,
          market,
          shipmentId,
        }).catch(() => null)
      : null;

    return { ok: true, shipmentId, labelPublicPath, raw };
  } catch (error) {
    return { ok: false, reason: "dpd_api_request_failed", raw: String(error) };
  }
}

export async function fetchDpdShipmentStatus(
  shipmentId: string
): Promise<DpdGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const path = (process.env.DPD_API_TRACK_PATH?.trim() || "/v1.1/shipments/{id}").replace(
    "{id}",
    encodeURIComponent(shipmentId)
  );
  const res = await dpdJsonRequest<Record<string, unknown>>("GET", path);
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown>;
  const state = String(raw.status || raw.state || "").toUpperCase();
  const trackingNumber = String(raw.parcelLabelNumber || raw.parcelNumber || raw.shipmentId || "").trim() || null;
  return { ok: true, data: { state, trackingNumber, raw } };
}

export async function cancelDpdShipment(shipmentId: string): Promise<DpdGenericResult<Record<string, unknown>>> {
  const path = (process.env.DPD_API_CANCEL_PATH?.trim() || "/v1.1/shipments/{id}/cancel").replace(
    "{id}",
    encodeURIComponent(shipmentId)
  );
  return dpdJsonRequest<Record<string, unknown>>("POST", path, {});
}

export async function createDpdPickup(
  market: Market,
  note: string
): Promise<DpdGenericResult<{ pickupId: string; pickupDate: string | null; raw: unknown }>> {
  const cfg = configured();
  if (!cfg.customerId || !cfg.senderAddressId) return { ok: false, reason: "dpd_api_not_configured" };
  const path = process.env.DPD_API_PICKUP_PATH?.trim() || "/v1.0/pickup-orders";
  const pickupDate = process.env.DPD_API_PICKUP_DATE?.trim() || null;
  const res = await dpdJsonRequest<Record<string, unknown>>("POST", path, {
    buCode: cfg.buCode,
    customerId: cfg.customerId,
    senderAddressId: cfg.senderAddressId,
    market,
    note: note.slice(0, 300),
    pickupDate,
  });
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown>;
  const pickupId = String(raw.pickupId || raw.id || raw.orderId || "").trim();
  if (!pickupId) return { ok: false, reason: "dpd_pickup_missing_id", raw };
  return { ok: true, data: { pickupId, pickupDate: String(raw.pickupDate || pickupDate || "") || null, raw } };
}

export async function buildDpdBulkLabel(shipmentIds: string[], market: Market): Promise<DpdGenericResult<string>> {
  const { baseUrl, token } = configured();
  if (!token) return { ok: false, reason: "dpd_api_not_configured" };
  const bytes = await fetchBulkLabelPdf(baseUrl, token, shipmentIds);
  if (!bytes) return { ok: false, reason: "dpd_bulk_label_failed" };
  const saved = await downloadAndSaveBulkLabelPdf({
    labelBytes: bytes,
    market,
    suffix: `${Date.now()}`,
  });
  if (!saved) return { ok: false, reason: "dpd_bulk_label_save_failed" };
  return { ok: true, data: saved };
}

export async function buildDpdLabelForShipment(
  shipmentId: string,
  orderNumber: number,
  market: Market
): Promise<DpdGenericResult<string>> {
  const { baseUrl, token } = configured();
  if (!token) return { ok: false, reason: "dpd_api_not_configured" };
  const bytes = await fetchLabelPdf(baseUrl, token, shipmentId);
  if (!bytes) return { ok: false, reason: "dpd_label_download_failed" };
  const saved = await downloadAndSaveLabelPdf({
    labelBytes: bytes,
    orderNumber,
    market,
    shipmentId,
  });
  if (!saved) return { ok: false, reason: "dpd_label_save_failed" };
  return { ok: true, data: saved };
}
