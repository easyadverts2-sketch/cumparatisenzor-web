import { Market, Order, OrderStatus, ShippingCarrier, Store } from "./types";
import { sendEmail } from "./email";
import { getSql } from "./db";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatOrderNumber } from "./order-format";
import { getStripe } from "./stripe-checkout";
import { PDFDocument } from "pdf-lib";
import {
  marketCurrency,
  renderInvoiceHtml,
  renderInvoiceText,
  type InvoiceKind,
} from "./billing";
import {
  cancelPplPickupByReference,
  cancelPplShipment,
  createPplPickup,
  createPplShipment,
  fetchPplBatchLabelPdf,
  fetchPplLabelPdfFromUrl,
  fetchPplBatchStatus,
  fetchPplPickupBatchStatus,
  pplDebugGet,
  fetchPplOrderInfoByCustomerReference,
  fetchPplShipmentByFilters,
  fetchPplShipmentInfoByCustomerReference,
  fetchPplShipmentInfoByNumber,
  type PplDebugRequestResult,
} from "./ppl";
import {
  isLikelyPplTrackingNumber,
  isUuid as isUuidStrict,
  validatePplShipmentBelongsToOrder,
} from "./ppl-tracking";
import {
  cancelDpdPickup,
  cancelDpdShipment,
  createDpdPickup,
  createDpdShipment,
  fetchDpdLabelPdfForShipments,
  fetchDpdShipmentStatus,
} from "./dpd";
import {
  buildInternalOrderAlertEmail,
  buildOrderCreatedEmail,
  buildPaymentReceivedEmail,
  buildTrackingEmail,
} from "./order-emails";

const defaultsByMarket: Record<Market, { inventory: number; sku: string; price: number; shipping: number }> = {
  RO: {
    inventory: 98,
    sku: "5021791006694",
    price: 350,
    shipping: 40,
  },
  HU: {
    inventory: 98,
    sku: "5021791006694",
    price: 25339,
    shipping: 3199,
  },
};

function senderEmailForMarket(market: Market) {
  if (market === "HU") {
    return process.env.SMTP_FROM_HU || "info@szenzorvasarlas.hu";
  }
  return process.env.SMTP_FROM || "info@cumparatisenzor.ro";
}

function internalOrderEmailForMarket(market: Market) {
  if (market === "HU") {
    return (
      process.env.INTERNAL_ORDER_EMAIL_HU ||
      process.env.INTERNAL_ORDER_EMAIL ||
      "info@szenzorvasarlas.hu"
    );
  }
  return (
    process.env.INTERNAL_ORDER_EMAIL_RO ||
    process.env.INTERNAL_ORDER_EMAIL ||
    "info@cumparatisenzor.ro"
  );
}

function settingKey(market: Market, key: "inventory" | "sku" | "price" | "shipping") {
  return market === "RO" ? key : `hu_${key}`;
}

type Row = Record<string, unknown>;
type SqlClient = ReturnType<typeof getSql>;

type InvoiceRow = {
  id: string;
  order_id: string;
  market: string;
  kind: string;
  sequence_no: number;
  invoice_no: string;
  variable_symbol: string;
  issue_date: string;
  due_date: string;
  currency: string;
  amount: number;
};

type AdminAuditRow = {
  id: string;
  created_at: string;
  market: string;
  action: string;
  order_id: string | null;
  order_number: number | null;
  details: string | null;
};

type PplPickupRow = {
  id: string;
  created_at: string;
  market: string;
  pickup_id: string;
  pickup_batch_id: string | null;
  pickup_reference: string | null;
  pickup_customer_reference: string | null;
  pickup_order_reference: string | null;
  pickup_send_date: string | null;
  pickup_send_time_from: string | null;
  pickup_send_time_to: string | null;
  shipment_count: number | null;
  pickup_http_status: number | null;
  pickup_last_error: string | null;
  raw_create_request: string | null;
  raw_create_response: string | null;
  raw_status_response: string | null;
  note: string | null;
  status: string;
};

type DpdPickupRow = {
  id: string;
  created_at: string;
  market: string;
  pickup_id: string;
  pickup_date: string | null;
  note: string | null;
  status: string;
};

function isUuidLike(value: string | null | undefined): boolean {
  const raw = String(value || "").trim();
  return isUuidStrict(raw);
}

function jsonForDb(value: unknown): string | null {
  try {
    return JSON.stringify(value ?? null).slice(0, 200000);
  } catch {
    return null;
  }
}

function sanitizeCarrierRaw(input: unknown): unknown {
  if (input == null) return null;
  if (Array.isArray(input)) return input.map((x) => sanitizeCarrierRaw(x));
  if (typeof input !== "object") return input;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (lower.includes("token") || lower.includes("authorization") || lower.includes("password")) continue;
    out[key] = sanitizeCarrierRaw(value);
  }
  return out;
}

function persistCarrierApiSnapshot(params: {
  carrier: "PPL" | "DPD";
  scope: string;
  normalized: Record<string, unknown>;
  raw: unknown;
  httpStatus?: number | null;
  error?: string | null;
}) {
  const normalizedEntries = Object.entries(params.normalized);
  const missingFields = normalizedEntries.filter(([, v]) => v == null || String(v).trim?.() === "").map(([k]) => k);
  const safeRaw = sanitizeCarrierRaw(params.raw);
  const report = {
    carrier: params.carrier,
    scope: params.scope,
    availableFields: normalizedEntries.filter(([, v]) => v != null && String(v).trim?.() !== "").map(([k]) => k),
    storedNormalized: params.normalized,
    rawOnly: Object.keys((safeRaw as Record<string, unknown>) || {}),
    missingFields,
    httpStatus: params.httpStatus ?? null,
    error: params.error || null,
  };
  console.info("[carrier-snapshot]", JSON.stringify(report));
  return { safeRaw, missingFields, report };
}

function collectTrackingCandidates(input: unknown, out: string[] = []): string[] {
  if (input == null) return out;
  if (Array.isArray(input)) {
    for (const item of input) collectTrackingCandidates(item, out);
    return out;
  }
  if (typeof input !== "object") return out;
  const rec = input as Record<string, unknown>;
  const keys = ["shipmentNumber", "masterShipmentNumber", "externalShipmentId", "parcelNumber"];
  for (const key of keys) {
    const candidate = String(rec[key] || "").trim();
    if (/^\d{8,20}$/.test(candidate) && !isUuidLike(candidate)) out.push(candidate);
  }
  const nums = rec.shipmentNumbers;
  if (Array.isArray(nums)) {
    for (const n of nums) {
      const candidate = String(n || "").trim();
      if (/^\d{8,20}$/.test(candidate) && !isUuidLike(candidate)) out.push(candidate);
    }
  }
  for (const value of Object.values(rec)) {
    collectTrackingCandidates(value, out);
  }
  return out;
}

type JsonPathMatch = {
  path: string;
  value: string | number;
};

function findValuePaths(input: unknown, needle: string): JsonPathMatch[] {
  const results: JsonPathMatch[] = [];
  const needleText = String(needle);
  const needleNum = Number(needleText);
  function walk(node: unknown, path: string) {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach((item, idx) => walk(item, `${path}[${idx}]`));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        const next = path ? `${path}.${k}` : k;
        walk(v, next);
      }
      return;
    }
    if (typeof node === "string") {
      if (node === needleText || node.includes(needleText)) {
        results.push({ path, value: node });
      }
      return;
    }
    if (typeof node === "number" && Number.isFinite(node)) {
      if (String(node) === needleText || node === needleNum) {
        results.push({ path, value: node });
      }
    }
  }
  walk(input, "");
  return results;
}

function valuesWithPaths(input: unknown, path = "", out: JsonPathMatch[] = []): JsonPathMatch[] {
  if (input == null) return out;
  if (Array.isArray(input)) {
    input.forEach((item, idx) => valuesWithPaths(item, `${path}[${idx}]`, out));
    return out;
  }
  if (typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      valuesWithPaths(v, path ? `${path}.${k}` : k, out);
    }
    return out;
  }
  if (typeof input === "string" || typeof input === "number") {
    out.push({ path, value: input });
  }
  return out;
}

function parseRecipientZip(deliveryAddress: string): string {
  const m = deliveryAddress.match(/\b(\d{4,6})\b/);
  return m ? m[1] : "";
}

function getByJsonPath(input: unknown, jsonPath: string): unknown {
  if (!jsonPath) return undefined;
  const tokenized = jsonPath.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur: unknown = input;
  for (const part of tokenized) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(part);
      if (!Number.isFinite(idx)) return undefined;
      cur = cur[idx];
      continue;
    }
    if (typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[part];
      continue;
    }
    return undefined;
  }
  return cur;
}

function toOrder(row: Row): Order {
  const orderNumber =
    row.order_number !== undefined && row.order_number !== null
      ? Number(row.order_number)
      : 0;
  const carrierRaw = row.shipping_carrier != null ? String(row.shipping_carrier) : "PPL";
  const shippingCarrier = (
    carrierRaw === "PPL" ||
    carrierRaw === "DPD" ||
    carrierRaw === "PACKETA" ||
    carrierRaw === "FINESHIP"
      ? carrierRaw === "PACKETA"
        ? "DPD"
        : carrierRaw
      : "PPL"
  ) as ShippingCarrier;
  return {
    id: String(row.id),
    orderNumber: Number.isFinite(orderNumber) ? orderNumber : 0,
    createdAt: new Date(String(row.created_at)).toISOString(),
    customerName: String(row.customer_name),
    email: String(row.email),
    phone: String(row.phone),
    billingAddress: String(row.billing_address),
    deliveryAddress: String(row.delivery_address),
    quantity: Number(row.quantity),
    paymentMethod: String(row.payment_method) as Order["paymentMethod"],
    shippingCarrier,
    shippingCarrierOther:
      row.shipping_carrier_other != null && String(row.shipping_carrier_other).trim() !== ""
        ? String(row.shipping_carrier_other)
        : null,
    shippingPrice: Number(row.shipping_price),
    itemPrice: Number(row.item_price),
    totalPrice: Number(row.total_price),
    status: String(row.status) as OrderStatus,
    market: String(row.market || "RO") as Market,
    pplShipmentId: row.ppl_shipment_id != null ? String(row.ppl_shipment_id) : null,
    pplBatchId: row.ppl_batch_id != null ? String(row.ppl_batch_id) : null,
    pplOrderBatchId: row.ppl_order_batch_id != null ? String(row.ppl_order_batch_id) : null,
    pplOrderNumber: row.ppl_order_number != null ? String(row.ppl_order_number) : null,
    pplOrderReference: row.ppl_order_reference != null ? String(row.ppl_order_reference) : null,
    pplImportState: row.ppl_import_state != null ? String(row.ppl_import_state) : null,
    pplShipmentState: row.ppl_shipment_state != null ? String(row.ppl_shipment_state) : null,
    pplLastHttpStatus: row.ppl_last_http_status != null ? Number(row.ppl_last_http_status) : null,
    pplLastError: row.ppl_last_error != null ? String(row.ppl_last_error) : null,
    pplRawCreateRequest: row.ppl_raw_create_request != null ? String(row.ppl_raw_create_request) : null,
    pplRawCreateResponse: row.ppl_raw_create_response != null ? String(row.ppl_raw_create_response) : null,
    pplLocationHeader: row.ppl_location_header != null ? String(row.ppl_location_header) : null,
    pplRawBatchStatusResponse:
      row.ppl_raw_batch_status_response != null ? String(row.ppl_raw_batch_status_response) : null,
    pplRawLabelResponse: row.ppl_raw_label_response != null ? String(row.ppl_raw_label_response) : null,
    pplRawOrderResponse: row.ppl_raw_order_response != null ? String(row.ppl_raw_order_response) : null,
    pplRawShipmentResponse: row.ppl_raw_shipment_response != null ? String(row.ppl_raw_shipment_response) : null,
    pplLabelUrl: row.ppl_label_url != null ? String(row.ppl_label_url) : null,
    pplCompleteLabelUrl: row.ppl_complete_label_url != null ? String(row.ppl_complete_label_url) : null,
    pplBulkLabelUrls: row.ppl_bulk_label_urls != null ? String(row.ppl_bulk_label_urls) : null,
    trackingNumberSource: row.tracking_number_source != null ? String(row.tracking_number_source) : null,
    trackingNumberJsonPath: row.tracking_number_json_path != null ? String(row.tracking_number_json_path) : null,
    pplTrackingUrl: row.ppl_tracking_url != null ? String(row.ppl_tracking_url) : null,
    pplCancelMode: row.ppl_cancel_mode != null ? String(row.ppl_cancel_mode) : null,
    pplCancelAttempted: row.ppl_cancel_attempted != null ? Boolean(row.ppl_cancel_attempted) : null,
    pplCancelShipmentNumber: row.ppl_cancel_shipment_number != null ? String(row.ppl_cancel_shipment_number) : null,
    pplCancelHttpStatus: row.ppl_cancel_http_status != null ? Number(row.ppl_cancel_http_status) : null,
    pplCancelResponse: row.ppl_cancel_response != null ? String(row.ppl_cancel_response) : null,
    pplLocalResetDone: row.ppl_local_reset_done != null ? Boolean(row.ppl_local_reset_done) : null,
    pplShipmentStatus: row.ppl_shipment_status != null ? String(row.ppl_shipment_status) : null,
    pplLabelPath: row.ppl_label_path != null ? String(row.ppl_label_path) : null,
    dpdShipmentId: row.dpd_shipment_id != null ? String(row.dpd_shipment_id) : null,
    dpdShipmentStatus: row.dpd_shipment_status != null ? String(row.dpd_shipment_status) : null,
    dpdLastHttpStatus: row.dpd_last_http_status != null ? Number(row.dpd_last_http_status) : null,
    dpdLastError: row.dpd_last_error != null ? String(row.dpd_last_error) : null,
    dpdRawCreateRequest: row.dpd_raw_create_request != null ? String(row.dpd_raw_create_request) : null,
    dpdRawCreateResponse: row.dpd_raw_create_response != null ? String(row.dpd_raw_create_response) : null,
    dpdRawStatusResponse: row.dpd_raw_status_response != null ? String(row.dpd_raw_status_response) : null,
    dpdRawLabelResponse: row.dpd_raw_label_response != null ? String(row.dpd_raw_label_response) : null,
    dpdRawCancelResponse: row.dpd_raw_cancel_response != null ? String(row.dpd_raw_cancel_response) : null,
    dpdCancelMode: row.dpd_cancel_mode != null ? String(row.dpd_cancel_mode) : null,
    dpdCancelAttempted: row.dpd_cancel_attempted != null ? Boolean(row.dpd_cancel_attempted) : null,
    dpdCancelHttpStatus: row.dpd_cancel_http_status != null ? Number(row.dpd_cancel_http_status) : null,
    dpdCancelResponse: row.dpd_cancel_response != null ? String(row.dpd_cancel_response) : null,
    dpdLocalResetDone: row.dpd_local_reset_done != null ? Boolean(row.dpd_local_reset_done) : null,
    dpdTrackingSource: row.dpd_tracking_source != null ? String(row.dpd_tracking_source) : null,
    dpdTrackingJsonPath: row.dpd_tracking_json_path != null ? String(row.dpd_tracking_json_path) : null,
    dpdLabelPath: row.dpd_label_path != null ? String(row.dpd_label_path) : null,
    trackingNumber: row.tracking_number != null ? String(row.tracking_number) : null,
    additionalNotes:
      row.additional_notes != null && String(row.additional_notes).trim() !== ""
        ? String(row.additional_notes)
        : null,
  };
}

function structuredValidationErrors(body: Record<string, unknown>): string {
  const errors = body.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const firstErr = errors[0];
    if (firstErr && typeof firstErr === "object") {
      const errRec = firstErr as Record<string, unknown>;
      return String(errRec.message || errRec.errorMessage || JSON.stringify(firstErr));
    }
    return String(firstErr);
  }
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const parts: string[] = [];
    for (const [key, val] of Object.entries(errors as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        parts.push(`${key}: ${val.map((x) => String(x)).join("; ")}`);
      } else if (val != null && typeof val === "object") {
        parts.push(`${key}: ${JSON.stringify(val)}`);
      } else if (val != null) {
        parts.push(`${key}: ${String(val)}`);
      }
    }
    return parts.join(" | ");
  }
  return "";
}

function shipmentErrorStatus(reason: string, raw?: unknown) {
  let detail = "";
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    let bodyRec: Record<string, unknown> =
      rec.body && typeof rec.body === "object" ? (rec.body as Record<string, unknown>) : rec;
    if (rec.body && typeof rec.body === "string") {
      try {
        const parsed = JSON.parse(rec.body as string) as unknown;
        if (parsed && typeof parsed === "object") {
          bodyRec = parsed as Record<string, unknown>;
        }
      } catch {
        /* keep bodyRec from rec */
      }
    }
    const fromErrors = structuredValidationErrors(bodyRec);
    const genericTitle = /^(badrequest|bad request|one or more validation errors occurred\.?)$/i;
    const candidate =
      bodyRec.Message ||
      bodyRec.message ||
      bodyRec.error ||
      bodyRec.error_description ||
      bodyRec.detail ||
      bodyRec.title ||
      rec.message ||
      rec.error ||
      rec.error_description ||
      rec.detail ||
      rec.title;
    const candStr = candidate != null ? String(candidate).trim() : "";
    if (fromErrors) {
      detail = genericTitle.test(candStr) || !candStr ? fromErrors : `${candStr} — ${fromErrors}`;
    } else if (candStr) {
      detail = candStr;
    }
    const trace =
      (bodyRec.traceId as string | undefined) ||
      (bodyRec.TraceId as string | undefined) ||
      (bodyRec.trace_id as string | undefined) ||
      "";
    if (trace) {
      detail = detail ? `${detail} (trace:${trace})` : `trace:${trace}`;
    }
    const headersRec =
      rec.headers && typeof rec.headers === "object"
        ? (rec.headers as Record<string, unknown>)
        : null;
    const reqId =
      (headersRec?.["x-correlation-id"] as string | undefined) ||
      (headersRec?.["x-request-id"] as string | undefined) ||
      "";
    if (reqId) {
      detail = detail ? `${detail} (req:${reqId})` : `req:${reqId}`;
    }
  } else if (typeof raw === "string") {
    detail = raw;
  }
  const suffix = detail ? `:${detail}` : "";
  return `ERROR:${reason}${suffix}`.slice(0, 2000);
}

function numericTrackingOrNull(value: string | null | undefined): string | null {
  const raw = String(value || "").trim();
  if (!/^\d{8,20}$/.test(raw)) return null;
  if (isUuidLike(raw)) return null;
  return raw;
}

export function formatPaymentMethodLabel(pm: Order["paymentMethod"]): string {
  if (pm === "COD") return "Dobírka";
  if (pm === "BANK_TRANSFER") return "Bankovní převod";
  return "Karta (online)";
}

export function formatShippingLine(order: Pick<Order, "shippingCarrier" | "shippingCarrierOther">): string {
  if (order.shippingCarrier === "PPL") return "PPL";
  if (order.shippingCarrier === "DPD") return "DPD";
  if (order.shippingCarrier === "FINESHIP") return "Fineship";
  return "PPL";
}

async function migrateOrderNumber(sql: SqlClient) {
  const col = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'order_number'
  `;
  if (col.length > 0) {
    await sql`alter table orders alter column order_number type bigint using order_number::bigint`;
    return;
  }
  await sql`alter table orders add column order_number bigint`;
  await sql`
    update orders o set order_number = r.rn from (
      select id, row_number() over (order by created_at asc)::int as rn from orders
    ) r where o.id = r.id
  `;
  await sql`create sequence if not exists orders_number_seq`;
  await sql`select setval('orders_number_seq', coalesce((select max(order_number) from orders), 0)::bigint)`;
  await sql`alter table orders alter column order_number set default nextval('orders_number_seq')`;
  await sql`alter table orders alter column order_number set not null`;
  await sql`create unique index if not exists orders_order_number_unique on orders(order_number)`;
}

function pragueDatePrefix(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value || "01";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const year = parts.find((p) => p.type === "year")?.value || "1970";
  return `${day}${month}${year}`;
}

async function nextDailyOrderNumber(sql: SqlClient): Promise<number | null> {
  const prefix = pragueDatePrefix();
  const start = Number(`${prefix}001`);
  const end = Number(`${prefix}999`);
  const rows = await sql`
    select max(order_number) as max_order
    from orders
    where order_number >= ${start} and order_number <= ${end}
  `;
  const maxRaw = rows[0]?.max_order;
  const maxVal = maxRaw != null ? Number(maxRaw) : 0;
  const nextSuffix = maxVal > 0 ? Number(String(maxVal).slice(-3)) + 1 : 1;
  if (nextSuffix > 999) return null;
  return Number(`${prefix}${String(nextSuffix).padStart(3, "0")}`);
}

async function migrateShippingCarrier(sql: SqlClient) {
  const col = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'shipping_carrier'
  `;
  if (col.length > 0) {
    return;
  }
  await sql`alter table orders add column shipping_carrier text not null default 'PPL'`;
  await sql`alter table orders add column shipping_carrier_other text`;
}

async function migrateOrderMarket(sql: SqlClient) {
  const col = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'market'
  `;
  if (col.length > 0) {
    return;
  }
  await sql`alter table orders add column market text not null default 'RO'`;
  await sql`create index if not exists orders_market_created_idx on orders(market, created_at desc)`;
}

async function migrateOrderShippingIntegration(sql: SqlClient) {
  const pplIdCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_shipment_id'
  `;
  if (pplIdCol.length === 0) {
    await sql`alter table orders add column ppl_shipment_id text`;
  }

  const pplBatchCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_batch_id'
  `;
  if (pplBatchCol.length === 0) {
    await sql`alter table orders add column ppl_batch_id text`;
  }
  const pplOrderBatchCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_order_batch_id'
  `;
  if (pplOrderBatchCol.length === 0) await sql`alter table orders add column ppl_order_batch_id text`;
  const pplOrderNumberCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_order_number'
  `;
  if (pplOrderNumberCol.length === 0) await sql`alter table orders add column ppl_order_number text`;
  const pplOrderReferenceCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_order_reference'
  `;
  if (pplOrderReferenceCol.length === 0) await sql`alter table orders add column ppl_order_reference text`;
  const pplImportStateCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_import_state'
  `;
  if (pplImportStateCol.length === 0) await sql`alter table orders add column ppl_import_state text`;
  const pplShipmentStateCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_shipment_state'
  `;
  if (pplShipmentStateCol.length === 0) await sql`alter table orders add column ppl_shipment_state text`;
  const pplLastHttpStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_last_http_status'
  `;
  if (pplLastHttpStatusCol.length === 0) await sql`alter table orders add column ppl_last_http_status integer`;
  const pplLastErrorCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_last_error'
  `;
  if (pplLastErrorCol.length === 0) await sql`alter table orders add column ppl_last_error text`;
  const pplRawCreateReqCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_raw_create_request'
  `;
  if (pplRawCreateReqCol.length === 0) await sql`alter table orders add column ppl_raw_create_request text`;
  const pplRawCreateResCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_raw_create_response'
  `;
  if (pplRawCreateResCol.length === 0) await sql`alter table orders add column ppl_raw_create_response text`;
  const pplLocationCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_location_header'
  `;
  if (pplLocationCol.length === 0) await sql`alter table orders add column ppl_location_header text`;
  const pplRawBatchCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_raw_batch_status_response'
  `;
  if (pplRawBatchCol.length === 0) await sql`alter table orders add column ppl_raw_batch_status_response text`;
  const pplRawLabelCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_raw_label_response'
  `;
  if (pplRawLabelCol.length === 0) await sql`alter table orders add column ppl_raw_label_response text`;
  const pplRawOrderCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_raw_order_response'
  `;
  if (pplRawOrderCol.length === 0) await sql`alter table orders add column ppl_raw_order_response text`;
  const pplRawShipmentCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_raw_shipment_response'
  `;
  if (pplRawShipmentCol.length === 0) await sql`alter table orders add column ppl_raw_shipment_response text`;
  const pplLabelUrlCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_label_url'
  `;
  if (pplLabelUrlCol.length === 0) await sql`alter table orders add column ppl_label_url text`;
  const pplCompleteLabelUrlCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_complete_label_url'
  `;
  if (pplCompleteLabelUrlCol.length === 0) await sql`alter table orders add column ppl_complete_label_url text`;
  const pplBulkLabelUrlsCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_bulk_label_urls'
  `;
  if (pplBulkLabelUrlsCol.length === 0) await sql`alter table orders add column ppl_bulk_label_urls text`;
  const trackingSourceCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'tracking_number_source'
  `;
  if (trackingSourceCol.length === 0) await sql`alter table orders add column tracking_number_source text`;
  const trackingPathCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'tracking_number_json_path'
  `;
  if (trackingPathCol.length === 0) await sql`alter table orders add column tracking_number_json_path text`;
  const trackingUrlCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_tracking_url'
  `;
  if (trackingUrlCol.length === 0) await sql`alter table orders add column ppl_tracking_url text`;
  const cancelModeCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_cancel_mode'
  `;
  if (cancelModeCol.length === 0) await sql`alter table orders add column ppl_cancel_mode text`;
  const cancelAttemptedCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_cancel_attempted'
  `;
  if (cancelAttemptedCol.length === 0) await sql`alter table orders add column ppl_cancel_attempted boolean`;
  const cancelShipmentCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_cancel_shipment_number'
  `;
  if (cancelShipmentCol.length === 0) await sql`alter table orders add column ppl_cancel_shipment_number text`;
  const cancelStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_cancel_http_status'
  `;
  if (cancelStatusCol.length === 0) await sql`alter table orders add column ppl_cancel_http_status integer`;
  const cancelRespCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_cancel_response'
  `;
  if (cancelRespCol.length === 0) await sql`alter table orders add column ppl_cancel_response text`;
  const localResetCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_local_reset_done'
  `;
  if (localResetCol.length === 0) await sql`alter table orders add column ppl_local_reset_done boolean`;
  await sql`
    update orders
    set ppl_batch_id = tracking_number, tracking_number = null
    where tracking_number ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
      and (ppl_batch_id is null or ppl_batch_id = '')
  `;

  const pplStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_shipment_status'
  `;
  if (pplStatusCol.length === 0) {
    await sql`alter table orders add column ppl_shipment_status text`;
  }

  const trackingCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'tracking_number'
  `;
  if (trackingCol.length === 0) {
    await sql`alter table orders add column tracking_number text`;
  }

  const labelPathCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'ppl_label_path'
  `;
  if (labelPathCol.length === 0) {
    await sql`alter table orders add column ppl_label_path text`;
  }

  const dpdIdCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_shipment_id'
  `;
  if (dpdIdCol.length === 0) {
    await sql`alter table orders add column dpd_shipment_id text`;
  }

  const dpdStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_shipment_status'
  `;
  if (dpdStatusCol.length === 0) {
    await sql`alter table orders add column dpd_shipment_status text`;
  }

  const dpdLabelCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_label_path'
  `;
  if (dpdLabelCol.length === 0) {
    await sql`alter table orders add column dpd_label_path text`;
  }
  const dpdLastHttpCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_last_http_status'
  `;
  if (dpdLastHttpCol.length === 0) await sql`alter table orders add column dpd_last_http_status integer`;
  const dpdLastErrCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_last_error'
  `;
  if (dpdLastErrCol.length === 0) await sql`alter table orders add column dpd_last_error text`;
  const dpdRawCreateReqCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_raw_create_request'
  `;
  if (dpdRawCreateReqCol.length === 0) await sql`alter table orders add column dpd_raw_create_request text`;
  const dpdRawCreateResCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_raw_create_response'
  `;
  if (dpdRawCreateResCol.length === 0) await sql`alter table orders add column dpd_raw_create_response text`;
  const dpdRawStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_raw_status_response'
  `;
  if (dpdRawStatusCol.length === 0) await sql`alter table orders add column dpd_raw_status_response text`;
  const dpdRawLabelCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_raw_label_response'
  `;
  if (dpdRawLabelCol.length === 0) await sql`alter table orders add column dpd_raw_label_response text`;
  const dpdRawCancelCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_raw_cancel_response'
  `;
  if (dpdRawCancelCol.length === 0) await sql`alter table orders add column dpd_raw_cancel_response text`;
  const dpdCancelModeCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_cancel_mode'
  `;
  if (dpdCancelModeCol.length === 0) await sql`alter table orders add column dpd_cancel_mode text`;
  const dpdCancelAttemptedCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_cancel_attempted'
  `;
  if (dpdCancelAttemptedCol.length === 0) await sql`alter table orders add column dpd_cancel_attempted boolean`;
  const dpdCancelHttpStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_cancel_http_status'
  `;
  if (dpdCancelHttpStatusCol.length === 0) await sql`alter table orders add column dpd_cancel_http_status integer`;
  const dpdCancelResponseCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_cancel_response'
  `;
  if (dpdCancelResponseCol.length === 0) await sql`alter table orders add column dpd_cancel_response text`;
  const dpdLocalResetDoneCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_local_reset_done'
  `;
  if (dpdLocalResetDoneCol.length === 0) await sql`alter table orders add column dpd_local_reset_done boolean`;
  const dpdTrackingSourceCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_tracking_source'
  `;
  if (dpdTrackingSourceCol.length === 0) await sql`alter table orders add column dpd_tracking_source text`;
  const dpdTrackingPathCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'dpd_tracking_json_path'
  `;
  if (dpdTrackingPathCol.length === 0) await sql`alter table orders add column dpd_tracking_json_path text`;
}

async function migrateOrderAdditionalNotes(sql: SqlClient) {
  const col = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'additional_notes'
  `;
  if (col.length === 0) {
    await sql`alter table orders add column additional_notes text`;
  }
}

async function ensureSchema(sql: SqlClient) {
  await sql`
    create table if not exists app_settings (
      key text primary key,
      value text not null
    )
  `;
  await sql`
    create table if not exists orders (
      id uuid primary key,
      created_at timestamptz not null default now(),
      customer_name text not null,
      email text not null,
      phone text not null,
      billing_address text not null,
      delivery_address text not null,
      quantity integer not null,
      payment_method text not null,
      shipping_price numeric not null,
      item_price numeric not null,
      total_price numeric not null,
      status text not null
    )
  `;
  await sql`
    create table if not exists notifications (
      id uuid primary key,
      created_at timestamptz not null default now(),
      type text not null,
      recipient text not null,
      subject text not null,
      body text not null
    )
  `;

  await sql`
    create table if not exists invoices (
      id uuid primary key,
      order_id uuid not null references orders(id) on delete cascade,
      market text not null,
      kind text not null,
      sequence_no integer not null,
      invoice_no text not null,
      variable_symbol text not null,
      issue_date date not null,
      due_date date not null,
      currency text not null,
      amount numeric not null,
      created_at timestamptz not null default now()
    )
  `;
  try {
    await sql`
      create table if not exists admin_audit_logs (
        id uuid primary key,
        created_at timestamptz not null default now(),
        market text not null,
        action text not null,
        order_id uuid,
        order_number integer,
        details text
      )
    `;
    await sql`create index if not exists admin_audit_logs_market_created_idx on admin_audit_logs(market, created_at desc)`;
  } catch {
    // Audit logging is optional and must never block checkout/admin core flow.
  }
  await sql`create unique index if not exists invoices_market_kind_seq_idx on invoices(market, kind, sequence_no)`;
  await sql`create index if not exists invoices_order_kind_idx on invoices(order_id, kind)`;
  await sql`
    create table if not exists ppl_pickups (
      id uuid primary key,
      created_at timestamptz not null default now(),
      market text not null,
      pickup_id text not null,
      pickup_batch_id text,
      pickup_reference text,
      pickup_customer_reference text,
      pickup_order_reference text,
      pickup_send_date text,
      pickup_send_time_from text,
      pickup_send_time_to text,
      shipment_count integer,
      pickup_http_status integer,
      pickup_last_error text,
      raw_create_request text,
      raw_create_response text,
      raw_status_response text,
      note text,
      status text not null default 'ORDERED'
    )
  `;
  await sql`create index if not exists ppl_pickups_market_created_idx on ppl_pickups(market, created_at desc)`;
  const pplPickupRefCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_reference'
  `;
  if (pplPickupRefCol.length === 0) await sql`alter table ppl_pickups add column pickup_reference text`;
  const pplPickupCustomerRefCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_customer_reference'
  `;
  if (pplPickupCustomerRefCol.length === 0) await sql`alter table ppl_pickups add column pickup_customer_reference text`;
  const pplPickupBatchCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_batch_id'
  `;
  if (pplPickupBatchCol.length === 0) await sql`alter table ppl_pickups add column pickup_batch_id text`;
  const pplPickupOrderRefCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_order_reference'
  `;
  if (pplPickupOrderRefCol.length === 0) await sql`alter table ppl_pickups add column pickup_order_reference text`;
  const pplPickupSendDateCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_send_date'
  `;
  if (pplPickupSendDateCol.length === 0) await sql`alter table ppl_pickups add column pickup_send_date text`;
  const pplPickupFromCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_send_time_from'
  `;
  if (pplPickupFromCol.length === 0) await sql`alter table ppl_pickups add column pickup_send_time_from text`;
  const pplPickupToCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_send_time_to'
  `;
  if (pplPickupToCol.length === 0) await sql`alter table ppl_pickups add column pickup_send_time_to text`;
  const pplPickupCountCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'shipment_count'
  `;
  if (pplPickupCountCol.length === 0) await sql`alter table ppl_pickups add column shipment_count integer`;
  const pplPickupHttpCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_http_status'
  `;
  if (pplPickupHttpCol.length === 0) await sql`alter table ppl_pickups add column pickup_http_status integer`;
  const pplPickupErrCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'pickup_last_error'
  `;
  if (pplPickupErrCol.length === 0) await sql`alter table ppl_pickups add column pickup_last_error text`;
  const pplPickupRawReqCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'raw_create_request'
  `;
  if (pplPickupRawReqCol.length === 0) await sql`alter table ppl_pickups add column raw_create_request text`;
  const pplPickupRawResCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'raw_create_response'
  `;
  if (pplPickupRawResCol.length === 0) await sql`alter table ppl_pickups add column raw_create_response text`;
  const pplPickupRawStatusCol = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ppl_pickups' and column_name = 'raw_status_response'
  `;
  if (pplPickupRawStatusCol.length === 0) await sql`alter table ppl_pickups add column raw_status_response text`;
  await sql`
    create table if not exists dpd_pickups (
      id uuid primary key,
      created_at timestamptz not null default now(),
      market text not null,
      pickup_id text not null,
      pickup_date text,
      note text,
      status text not null default 'ORDERED'
    )
  `;
  await sql`create index if not exists dpd_pickups_market_created_idx on dpd_pickups(market, created_at desc)`;

  await sql`
    insert into app_settings (key, value) values
      ('inventory', ${String(defaultsByMarket.RO.inventory)}),
      ('sku', ${defaultsByMarket.RO.sku}),
      ('price', ${String(defaultsByMarket.RO.price)}),
      ('shipping', ${String(defaultsByMarket.RO.shipping)}),
      ('hu_inventory', ${String(defaultsByMarket.HU.inventory)}),
      ('hu_sku', ${defaultsByMarket.HU.sku}),
      ('hu_price', ${String(defaultsByMarket.HU.price)}),
      ('hu_shipping', ${String(defaultsByMarket.HU.shipping)})
    on conflict (key) do nothing
  `;

  await migrateOrderNumber(sql);
  await migrateShippingCarrier(sql);
  await migrateOrderMarket(sql);
  await migrateOrderShippingIntegration(sql);
  await migrateOrderAdditionalNotes(sql);
}

async function insertAuditLog(
  sql: SqlClient,
  input: { market: Market; action: string; orderId?: string | null; orderNumber?: number | null; details?: string | null }
) {
  await sql`
    insert into admin_audit_logs (id, market, action, order_id, order_number, details)
    values (
      ${crypto.randomUUID()},
      ${input.market},
      ${input.action},
      ${input.orderId || null},
      ${input.orderNumber || null},
      ${input.details || null}
    )
  `;
}

async function createShipmentForOrder(
  sql: SqlClient,
  order: Order,
  market: Market,
  senderFrom: string,
  auditDetailPrefix?: string
) {
  if (order.shippingCarrier === "PPL") {
    const ppl = await createPplShipment(order, market);
    if (ppl.ok) {
      const tracking = numericTrackingOrNull(ppl.shipmentNumber);
      await sql`
        update orders
        set
          ppl_shipment_id = ${tracking},
          ppl_batch_id = ${ppl.batchId},
          ppl_order_reference = ${ppl.referenceId || String(order.orderNumber)},
          ppl_import_state = ${tracking ? "Complete" : "Created"},
          ppl_shipment_status = ${tracking ? "PPL_TRACKING_READY" : "PPL_BATCH_CREATED"},
          ppl_last_http_status = 201,
          ppl_last_error = null,
          ppl_raw_create_request = ${jsonForDb(ppl.createRequest)},
          ppl_raw_create_response = ${jsonForDb(ppl.raw)},
          ppl_location_header = ${ppl.locationHeader || null},
          tracking_number = ${tracking},
          ppl_label_path = ${ppl.labelPublicPath || null}
        where id = ${order.id}
      `;
      await insertAuditLog(sql, {
        market,
        action: "PPL_SHIPMENT_CREATED",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: `${auditDetailPrefix || ""} shipment=${tracking || "-"} batch=${ppl.batchId || "-"} label=${ppl.labelPublicPath || "-"}`.trim(),
      });
      void syncPplBatch(order.id, market).catch(() => undefined);
      for (const delayMs of [1000, 3000, 10000, 30000]) {
        setTimeout(() => {
          void syncPplBatch(order.id, market).catch(() => undefined);
        }, delayMs);
      }
      const withTracking = await getOrderById(order.id, market);
      if (withTracking?.trackingNumber && withTracking.paymentMethod !== "COD") {
        const trackingEmail = buildTrackingEmail(withTracking, market, withTracking.trackingNumber);
        await sendEmail({
          to: withTracking.email,
          subject: trackingEmail.subject,
          text: trackingEmail.text,
          html: trackingEmail.html,
          from: senderFrom,
        }).catch(() => undefined);
      }
      return;
    }
    const pplErr = shipmentErrorStatus(ppl.reason, ppl.raw);
    await sql`
      update orders
      set ppl_shipment_status = ${pplErr}
      where id = ${order.id}
    `;
    await insertAuditLog(sql, {
      market,
      action: "PPL_SHIPMENT_ERROR",
      orderId: order.id,
      orderNumber: order.orderNumber,
      details: `${auditDetailPrefix || ""} ${pplErr}`.trim().slice(0, 4000),
    });
    return;
  }

  if (order.shippingCarrier === "DPD") {
    const dpd = await createDpdShipment(order, market);
    if (dpd.ok) {
      const tracking = numericTrackingOrNull(dpd.trackingNumber) || numericTrackingOrNull(order.trackingNumber);
      await sql`
        update orders
        set
          dpd_shipment_id = ${dpd.shipmentId},
          dpd_shipment_status = ${tracking ? "TRACKING_READY" : "CREATED"},
          tracking_number = ${tracking},
          dpd_last_http_status = ${dpd.httpStatus || 201},
          dpd_last_error = null,
          dpd_raw_create_request = ${jsonForDb(dpd.createRequest || null)},
          dpd_raw_create_response = ${jsonForDb(dpd.raw || null)},
          dpd_tracking_source = ${tracking ? "create_response" : null},
          dpd_tracking_json_path = ${tracking ? "auto:parcelLabelNumber|parcelNumber|trackingNumber" : null}
        where id = ${order.id}
      `;
      await insertAuditLog(sql, {
        market,
        action: "DPD_SHIPMENT_CREATED",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: `${auditDetailPrefix || ""} shipment=${dpd.shipmentId} tracking=${tracking || "-"}`.trim(),
      });
      const withTracking = await getOrderById(order.id, market);
      if (withTracking?.trackingNumber && withTracking.paymentMethod !== "COD") {
        const trackingEmail = buildTrackingEmail(withTracking, market, withTracking.trackingNumber);
        await sendEmail({
          to: withTracking.email,
          subject: trackingEmail.subject,
          text: trackingEmail.text,
          html: trackingEmail.html,
          from: senderFrom,
        }).catch(() => undefined);
      }
      return;
    }
    const dpdErr = shipmentErrorStatus(dpd.reason, dpd.raw);
    const dpdStatus = dpd.reason === "dpd_cod_not_allowed_hu" ? "DPD_HU_COD_NOT_ENABLED" : dpdErr;
    await sql`
      update orders
      set dpd_shipment_status = ${dpdStatus}
      where id = ${order.id}
    `;
    await insertAuditLog(sql, {
      market,
      action: "DPD_SHIPMENT_ERROR",
      orderId: order.id,
      orderNumber: order.orderNumber,
      details: `${auditDetailPrefix || ""} ${dpdErr}`.trim().slice(0, 4000),
    });
  }
}

async function savePplLabelFromBatch(
  sql: SqlClient,
  order: Order,
  market: Market
): Promise<string | null> {
  const batchId = order.pplBatchId || (isUuidLike(order.pplShipmentId) ? order.pplShipmentId : null);
  if (!batchId) return order.pplLabelPath || null;
  let labelRes = await fetchPplBatchLabelPdf({
    batchId,
    completeLabelUrl: order.pplCompleteLabelUrl || null,
  });
  if (!labelRes.ok && order.pplLabelUrl) {
    const byItem = await fetchPplLabelPdfFromUrl(order.pplLabelUrl);
    if (byItem.ok) labelRes = byItem;
  }
  if (!labelRes.ok) {
    const statusMatch = /ppl_api_http_(\d+)/.exec(labelRes.reason || "");
    const httpStatus = statusMatch ? Number(statusMatch[1]) : null;
    await sql`
      update orders
      set
        ppl_last_http_status = ${httpStatus},
        ppl_raw_label_response = ${jsonForDb({ reason: labelRes.reason, raw: labelRes.raw })},
        ppl_shipment_status = ${
          httpStatus === 500 || httpStatus === 503 || httpStatus === 404 || httpStatus === 400
            ? "PPL_PROCESSING"
            : "PPL_ERROR"
        }
      where id = ${order.id}
    `;
    return order.pplLabelPath || null;
  }
  const contentType = String(labelRes.data.contentType || "").toLowerCase();
  const bufferLength = labelRes.data.bytes.length;
  const startsWithPdfMagic = bufferLength >= 4 && labelRes.data.bytes.subarray(0, 4).toString("utf8") === "%PDF";
  const isPdfContentType = contentType.includes("application/pdf");
  if (!isPdfContentType && !startsWithPdfMagic) {
    await sql`
      update orders
      set
        ppl_last_http_status = 200,
        ppl_shipment_status = 'PPL_PROCESSING',
        ppl_raw_label_response = ${
          jsonForDb({
            ok: false,
            error: "label_not_pdf",
            url: labelRes.data.finalUrl,
            contentType: labelRes.data.contentType,
            bufferLength,
            startsWithPdfMagic,
          })
        }
      where id = ${order.id}
    `;
    return order.pplLabelPath || null;
  }
  const relDir = process.env.PPL_LABEL_SAVE_DIR?.trim() || "public/ppl-labels";
  const absDir = path.resolve(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const fileName = `${market.toLowerCase()}-${order.orderNumber}-${Date.now()}.pdf`;
  const outPath = path.join(absDir, fileName);
  await writeFile(outPath, labelRes.data.bytes);
  const publicPath = relDir.startsWith("public/")
    ? `/${relDir.replace(/^public\//, "")}/${fileName}`
    : null;
  if (!publicPath) return order.pplLabelPath || null;
  await sql`
    update orders
    set
      ppl_label_path = ${publicPath},
      ppl_shipment_status = 'PPL_LABEL_READY',
      ppl_last_http_status = 200,
      ppl_raw_label_response = ${
        jsonForDb({
          ok: true,
          url: labelRes.data.finalUrl,
          contentType: labelRes.data.contentType,
          contentLength: bufferLength,
          bufferLength,
          startsWithPdfMagic,
        })
      }
    where id = ${order.id}
  `;
  return publicPath;
}

async function persistPplTrackingResult(
  sql: SqlClient,
  orderId: string,
  payload: {
    trackingNumber: string;
    importState: string;
    labelUrl?: string | null;
    completeLabelUrl?: string | null;
    rawBatch?: unknown;
  }
) {
  await sql`
    update orders
    set
      tracking_number = ${payload.trackingNumber},
      ppl_shipment_id = ${payload.trackingNumber},
      ppl_import_state = ${payload.importState || "Complete"},
      ppl_last_http_status = 200,
      ppl_last_error = null,
      ppl_label_url = ${payload.labelUrl || null},
      ppl_complete_label_url = ${payload.completeLabelUrl || null},
      ppl_raw_batch_status_response = ${jsonForDb(payload.rawBatch || null)},
      ppl_shipment_status = 'PPL_TRACKING_READY'
    where id = ${orderId}
  `;
}

async function resetPplFields(sql: SqlClient, orderId: string, cancelMode: string) {
  await sql`
    update orders
    set
      ppl_shipment_id = null,
      ppl_batch_id = null,
      ppl_order_reference = null,
      ppl_order_number = null,
      ppl_shipment_status = null,
      ppl_import_state = null,
      ppl_shipment_state = null,
      ppl_last_http_status = null,
      ppl_last_error = null,
      ppl_label_path = null,
      ppl_label_url = null,
      ppl_complete_label_url = null,
      ppl_bulk_label_urls = null,
      ppl_tracking_url = null,
      tracking_number = null,
      tracking_number_source = null,
      tracking_number_json_path = null,
      ppl_raw_create_request = null,
      ppl_raw_create_response = null,
      ppl_location_header = null,
      ppl_raw_batch_status_response = null,
      ppl_raw_label_response = null,
      ppl_raw_order_response = null,
      ppl_raw_shipment_response = null,
      ppl_cancel_mode = ${cancelMode},
      ppl_local_reset_done = true
    where id = ${orderId}
  `;
}

async function nextInvoiceSequence(sql: SqlClient, market: Market, kind: InvoiceKind): Promise<number> {
  const key = `${market.toLowerCase()}_${kind.toLowerCase()}_invoice_seq`;
  const rows = await sql`select value from app_settings where key = ${key} limit 1`;
  const current = rows.length > 0 ? Number(rows[0].value) : 0;
  const next = Number.isFinite(current) ? current + 1 : 1;
  await sql`
    insert into app_settings (key, value) values (${key}, ${String(next)})
    on conflict (key) do update set value = excluded.value
  `;
  return next;
}

async function createInvoiceRecord(sql: SqlClient, order: Order, market: Market, kind: InvoiceKind) {
  const existing = await sql<InvoiceRow[]>`
    select * from invoices where order_id = ${order.id} and kind = ${kind} and market = ${market}
    order by created_at desc
    limit 1
  `;
  if (existing.length > 0) {
    return existing[0];
  }

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 5);
  const sequenceNo = await nextInvoiceSequence(sql, market, kind);
  const invoiceNo = String(order.orderNumber);
  const variableSymbol = String(order.orderNumber);
  const currency = marketCurrency(market);
  const amount = order.totalPrice;

  const inserted = await sql<InvoiceRow[]>`
    insert into invoices (
      id, order_id, market, kind, sequence_no, invoice_no, variable_symbol,
      issue_date, due_date, currency, amount
    ) values (
      ${crypto.randomUUID()}, ${order.id}, ${market}, ${kind}, ${sequenceNo}, ${invoiceNo},
      ${variableSymbol}, ${issueDate.toISOString().slice(0, 10)}, ${dueDate.toISOString().slice(0, 10)},
      ${currency}, ${amount}
    )
    returning *
  `;
  return inserted[0];
}

async function getSettingNumber(sql: SqlClient, key: string, fallback: number) {
  const rows = await sql`select value from app_settings where key = ${key} limit 1`;
  if (rows.length === 0) return fallback;
  const value = Number(rows[0].value);
  return Number.isFinite(value) ? value : fallback;
}

async function getSettingString(sql: SqlClient, key: string, fallback: string) {
  const rows = await sql`select value from app_settings where key = ${key} limit 1`;
  return rows.length === 0 ? fallback : String(rows[0].value);
}

export async function readStore(market: Market = "RO"): Promise<Store> {
  const sql = getSql();
  await ensureSchema(sql);
  const defaults = defaultsByMarket[market];
  const [inventory, sku, price, shipping, orderRows, notificationRows] = await Promise.all([
    getSettingNumber(sql, settingKey(market, "inventory"), defaults.inventory),
    getSettingString(sql, settingKey(market, "sku"), defaults.sku),
    getSettingNumber(sql, settingKey(market, "price"), defaults.price),
    getSettingNumber(sql, settingKey(market, "shipping"), defaults.shipping),
    sql`select * from orders where market = ${market} order by created_at desc`,
    sql`select * from notifications order by created_at desc`,
  ]);

  return {
    inventory,
    sku,
    price,
    shipping,
    orders: orderRows.map((r) => toOrder(r as unknown as Row)),
    notifications: notificationRows.map((n) => ({
      id: String(n.id),
      createdAt: new Date(String(n.created_at)).toISOString(),
      type: String(n.type) as "ORDER_CONFIRMATION" | "OUT_OF_STOCK",
      to: String(n.recipient),
      subject: String(n.subject),
      body: String(n.body),
    })),
  };
}

export async function writeStore(store: Store, market: Market = "RO"): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
  await sql`insert into app_settings (key, value) values (${settingKey(market, "inventory")}, ${String(store.inventory)})
            on conflict (key) do update set value = excluded.value`;
}

export async function createOrder(input: {
  customerName: string;
  email: string;
  phone: string;
  billingAddress: string;
  deliveryAddress: string;
  quantity: number;
  paymentMethod: Order["paymentMethod"];
  shippingCarrier: ShippingCarrier;
  shippingCarrierOther?: string | null;
  additionalNotes?: string | null;
}, market: Market = "RO"): Promise<{ ok: boolean; order?: Order; message: string }> {
  try {
    const senderFrom = senderEmailForMarket(market);
    const sql = getSql();
    await ensureSchema(sql);

    if (input.paymentMethod === "CARD_STRIPE" && !getStripe()) {
      return {
        ok: false,
        message:
          "Plata cu cardul nu este activata pe server. Alegeti alta metoda sau incercati mai tarziu.",
      };
    }

    const defaults = defaultsByMarket[market];
    const inventory = await getSettingNumber(sql, settingKey(market, "inventory"), defaults.inventory);
    const price = await getSettingNumber(sql, settingKey(market, "price"), defaults.price);
    if (input.shippingCarrier === "FINESHIP" && input.quantity < 6) {
      return {
        ok: false,
        message: "Fineship este disponibil doar pentru comenzi de minimum 6 senzori.",
      };
    }
    if (market === "HU" && input.shippingCarrier === "DPD" && input.paymentMethod === "COD") {
      return {
        ok: false,
        message: "Pentru Ungaria, DPD nu permite plata ramburs. Alegeti transfer bancar.",
      };
    }
    if (market === "RO" && input.shippingCarrier === "PPL" && input.paymentMethod === "COD") {
      return {
        ok: false,
        message:
          "PPL nu permite plata ramburs pentru livrari in Romania. Alegeti DPD sau transfer bancar.",
      };
    }
    const shippingPrice =
      market === "HU"
        ? input.shippingCarrier === "FINESHIP"
          ? 16000
          : input.quantity >= 5
            ? 0
            : 3199
        : input.shippingCarrier === "FINESHIP"
          ? 200
          : input.quantity >= 5
            ? 0
            : 40;
    const totalPrice = input.quantity * price + shippingPrice;

    const carrierOther = null;

    const duplicateRows = await sql`
      select * from orders
      where market = ${market}
        and email = ${input.email}
        and phone = ${input.phone}
        and delivery_address = ${input.deliveryAddress}
        and quantity = ${input.quantity}
        and payment_method = ${input.paymentMethod}
        and shipping_carrier = ${input.shippingCarrier}
        and created_at > now() - interval '5 minutes'
      order by created_at desc
      limit 1
    `;
    if (duplicateRows.length > 0) {
      const existing = toOrder(duplicateRows[0] as unknown as Row);
      return {
        ok: true,
        order: existing,
        message: "Duplicitni klik detekovan; vracime existujici objednavku.",
      };
    }

    if (input.quantity > inventory) {
      const subject = "Stoc indisponibil momentan";
      const body =
        "Momentan nu avem stoc suficient. Va vom contacta imediat ce produsul este disponibil din nou.";
      await sql`
        insert into notifications (id, type, recipient, subject, body)
        values (${crypto.randomUUID()}, 'OUT_OF_STOCK', ${input.email}, ${subject}, ${body})
      `;
      await sendEmail({ to: input.email, subject, text: body, from: senderFrom }).catch(() => undefined);
      return { ok: false, message: "Stoc insuficient. V-am trimis o informare." };
    }

    const status: OrderStatus =
      input.paymentMethod === "BANK_TRANSFER" || input.paymentMethod === "CARD_STRIPE"
        ? "ORDERED_NOT_PAID"
        : "WAITING_FOR_SHIPPING";
    let insertedRow: Row | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = await nextDailyOrderNumber(sql);
      if (!orderNumber) {
        return {
          ok: false,
          message:
            "Limit 999 objednavek za den byl dosazen. Kontaktujte prosim podporu.",
        };
      }
      const orderId = crypto.randomUUID();
      const additionalNotes = (input.additionalNotes || "").trim().slice(0, 1000);
      try {
        const inserted = await sql`
          insert into orders (
            id, order_number, customer_name, email, phone, billing_address, delivery_address,
            quantity, payment_method, shipping_price, item_price, total_price, status,
            shipping_carrier, shipping_carrier_other, market, additional_notes
          ) values (
            ${orderId}, ${orderNumber}, ${input.customerName}, ${input.email}, ${input.phone},
            ${input.billingAddress}, ${input.deliveryAddress},
            ${input.quantity}, ${input.paymentMethod}, ${shippingPrice},
            ${price}, ${totalPrice}, ${status},
            ${input.shippingCarrier}, ${carrierOther}, ${market}, ${additionalNotes || null}
          )
          returning *
        `;
        insertedRow = inserted[0] as unknown as Row;
        break;
      } catch (err) {
        const code = (err as { code?: string } | null)?.code || "";
        if (code === "23505") {
          continue;
        }
        throw err;
      }
    }
    if (!insertedRow) {
      return {
        ok: false,
        message: "Objednavku se nepodarilo vytvorit. Zkuste to prosim znovu.",
      };
    }
    const order = toOrder(insertedRow);
    const shouldCreateShipmentImmediately =
      order.paymentMethod === "COD" &&
      (order.shippingCarrier === "PPL" || order.shippingCarrier === "DPD");
    try {
      let proforma: InvoiceRow | null = null;
      if (input.paymentMethod === "BANK_TRANSFER") {
        proforma = await createInvoiceRecord(sql, order, market, "PROFORMA");
      }

      const nr = formatOrderNumber(order.orderNumber);
      let customerMailOrder = order;

      if (proforma) {
        const invoiceText = renderInvoiceText(order, {
          invoiceNo: proforma.invoice_no,
          sequenceNo: Number(proforma.sequence_no),
          variableSymbol: proforma.variable_symbol,
          issueDateIso: String(proforma.issue_date),
          dueDateIso: String(proforma.due_date),
          currency: marketCurrency(market),
          market,
          kind: "PROFORMA",
          total: Number(proforma.amount),
        });
        const invoiceHtml = renderInvoiceHtml(order, {
          invoiceNo: proforma.invoice_no,
          sequenceNo: Number(proforma.sequence_no),
          variableSymbol: proforma.variable_symbol,
          issueDateIso: String(proforma.issue_date),
          dueDateIso: String(proforma.due_date),
          currency: marketCurrency(market),
          market,
          kind: "PROFORMA",
          total: Number(proforma.amount),
        });
        const proformaSubject =
          market === "HU"
            ? `Dijbekero / proforma #${proforma.invoice_no}`
            : `Factura proforma #${proforma.invoice_no}`;
        const proformaBody =
          market === "HU"
            ? `A rendeleshez dijbekero keszult. A csatolt proforma tartalmazza a fizetendo osszeget es a valtozo szamot (${proforma.variable_symbol}).`
            : `Pentru comanda a fost emisa factura proforma. In fisierul atasat gasiti suma de plata si numarul variabil (${proforma.variable_symbol}).`;
        await sendEmail({
          to: input.email,
          subject: proformaSubject,
          text: proformaBody,
          html: invoiceHtml,
          from: senderFrom,
          attachments: [
            {
              filename: `${proforma.invoice_no}.html`,
              content: invoiceHtml,
              contentType: "text/html; charset=utf-8",
            },
            {
              filename: `${proforma.invoice_no}.txt`,
              content: invoiceText,
              contentType: "text/plain; charset=utf-8",
            },
          ],
        }).catch(() => undefined);
      }

      const internal = internalOrderEmailForMarket(market);
      if (internal) {
        const internalAlert = buildInternalOrderAlertEmail(order, market);
        await sendEmail({
          to: internal,
          subject: internalAlert.subject,
          text: internalAlert.text,
          html: internalAlert.html,
          from: senderFrom,
        }).catch(() => undefined);
      }

      if (shouldCreateShipmentImmediately) {
        const defaults = defaultsByMarket[market];
        const invRows = await sql`select value from app_settings where key = ${settingKey(market, "inventory")} limit 1`;
        const inventory = invRows.length === 0 ? defaults.inventory : Number(invRows[0].value);
        if (inventory >= order.quantity) {
          await sql`update app_settings set value = ${String(inventory - order.quantity)} where key = ${settingKey(market, "inventory")}`;
          await sql`
            update orders
            set status = 'ORDERED_PPLRDY'
            where id = ${order.id}
          `;
          void createShipmentForOrder(sql, order, market, senderFrom, "immediate_cod_shipment_async").catch(
            () => undefined
          );
        }
      }

      const createdEmail = buildOrderCreatedEmail(customerMailOrder, market, proforma?.variable_symbol || null);
      await sql`
        insert into notifications (id, type, recipient, subject, body)
        values (${crypto.randomUUID()}, 'ORDER_CONFIRMATION', ${input.email}, ${createdEmail.subject}, ${createdEmail.text})
      `;
      await sendEmail({
        to: input.email,
        subject: createdEmail.subject,
        text: createdEmail.text,
        html: createdEmail.html,
        from: senderFrom,
      }).catch(() => undefined);
    } catch (postProcessError) {
      console.error("[createOrder] post-process warning", {
        market,
        orderId: order.id,
        orderNumber: order.orderNumber,
        error: String(postProcessError),
      });
    }

    const freshOrder = await getOrderById(order.id, market);
    return { ok: true, order: freshOrder || order, message: "Comanda a fost inregistrata." };
  } catch (error) {
    console.error("[createOrder] failed", {
      market,
      error: String(error),
    });
    return {
      ok: false,
      message: "Comanda nu a putut fi procesata momentan. Va rugam sa incercati din nou.",
    };
  }
}

export async function autoCancelExpiredOrders() {
  const sql = getSql();
  await ensureSchema(sql);
  await sql`
    update orders
    set status = 'CANCELLED_BY_US'
    where payment_method in ('BANK_TRANSFER', 'CARD_STRIPE')
      and status = 'ORDERED_NOT_PAID'
      and created_at < now() - interval '5 days'
  `;
}

export async function getOrderByNumber(orderNumber: number, market: Market = "RO"): Promise<Order | null> {
  const sql = getSql();
  await ensureSchema(sql);
  if (!Number.isFinite(orderNumber) || orderNumber < 1) {
    return null;
  }
  const rows = await sql`select * from orders where order_number = ${orderNumber} and market = ${market} limit 1`;
  if (rows.length === 0) {
    return null;
  }
  return toOrder(rows[0] as unknown as Row);
}

export async function getOrderById(orderId: string, market: Market = "RO"): Promise<Order | null> {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql`select * from orders where id = ${orderId} and market = ${market} limit 1`;
  if (rows.length === 0) {
    return null;
  }
  return toOrder(rows[0] as unknown as Row);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql`select * from orders where id = ${orderId} and market = ${market} limit 1`;
  if (rows.length === 0) {
    return false;
  }
  const order = toOrder(rows[0] as unknown as Row);
  const senderFrom = senderEmailForMarket(market);
  const oldStatus = order.status;

  let shouldIssueFinalInvoice = false;
  let shouldCreateShipment = false;

  const updated = await sql.begin(async (tx) => {
    const defaults = defaultsByMarket[market];
    const invRows = await tx`select value from app_settings where key = ${settingKey(market, "inventory")} limit 1`;
    const inventory = invRows.length === 0 ? defaults.inventory : Number(invRows[0].value);

    const prepaid =
      order.paymentMethod === "BANK_TRANSFER" || order.paymentMethod === "CARD_STRIPE";
    if (status === "ORDERED_PAID_NOT_SHIPPED" && prepaid && order.status === "ORDERED_NOT_PAID") {
      if (inventory < order.quantity) {
        await tx`update orders set status = 'CANCELLED_QUANTITY' where id = ${orderId}`;
        return true;
      }
      await tx`update app_settings set value = ${String(inventory - order.quantity)} where key = ${settingKey(market, "inventory")}`;
      shouldIssueFinalInvoice = true;
      shouldCreateShipment = true;
    }

    if (
      status === "ORDERED_PAID_NOT_SHIPPED" &&
      order.paymentMethod === "COD" &&
      order.status === "WAITING_FOR_SHIPPING"
    ) {
      if (market === "HU" && order.shippingCarrier === "DPD") {
        await tx`update orders set status = 'WAITING_FOR_SHIPPING' where id = ${orderId}`;
        return true;
      }
      if (inventory < order.quantity) {
        await tx`update orders set status = 'CANCELLED_QUANTITY' where id = ${orderId}`;
        return true;
      }
      await tx`update app_settings set value = ${String(inventory - order.quantity)} where key = ${settingKey(market, "inventory")}`;
      shouldCreateShipment = true;
    }

    if (
      status === "ORDERED_PPLRDY" &&
      order.paymentMethod === "COD" &&
      (order.status === "WAITING_FOR_SHIPPING" || order.status === "ORDERED_PPLRDY") &&
      (order.shippingCarrier === "PPL" || order.shippingCarrier === "DPD")
    ) {
      if (market === "HU" && order.shippingCarrier === "DPD") {
        await tx`update orders set status = 'WAITING_FOR_SHIPPING' where id = ${orderId}`;
        return true;
      }
      if (order.status === "WAITING_FOR_SHIPPING") {
        if (inventory < order.quantity) {
          await tx`update orders set status = 'CANCELLED_QUANTITY' where id = ${orderId}`;
          return true;
        }
        await tx`update app_settings set value = ${String(inventory - order.quantity)} where key = ${settingKey(market, "inventory")}`;
      }
      if (
        order.status === "WAITING_FOR_SHIPPING" ||
        (!order.pplShipmentId && !order.dpdShipmentId)
      ) {
        shouldCreateShipment = true;
      }
    }

    if (
      status === "SHIPPED" &&
      order.paymentMethod === "COD" &&
      order.status === "WAITING_FOR_SHIPPING"
    ) {
      if (inventory < order.quantity) {
        await tx`update orders set status = 'CANCELLED_QUANTITY' where id = ${orderId}`;
        return true;
      }
      await tx`update app_settings set value = ${String(inventory - order.quantity)} where key = ${settingKey(market, "inventory")}`;
    }

    await tx`update orders set status = ${status} where id = ${orderId}`;
    return true;
  });

  if (!updated) return false;

  await insertAuditLog(sql, {
    market,
    action: "ORDER_STATUS_UPDATED",
    orderId,
    orderNumber: order.orderNumber,
    details: `${oldStatus} -> ${status}`,
  });

  if (shouldIssueFinalInvoice || shouldCreateShipment) {
    const sql = getSql();
    await ensureSchema(sql);
    const refreshed = await getOrderById(orderId, market);
    if (refreshed) {
      if (shouldIssueFinalInvoice) {
        const finalInvoice = await createInvoiceRecord(sql, refreshed, market, "FINAL");
        const invoiceText = renderInvoiceText(refreshed, {
          invoiceNo: finalInvoice.invoice_no,
          sequenceNo: Number(finalInvoice.sequence_no),
          variableSymbol: finalInvoice.variable_symbol,
          issueDateIso: String(finalInvoice.issue_date),
          dueDateIso: String(finalInvoice.due_date),
          currency: marketCurrency(market),
          market,
          kind: "FINAL",
          total: Number(finalInvoice.amount),
        });
        const invoiceHtml = renderInvoiceHtml(refreshed, {
          invoiceNo: finalInvoice.invoice_no,
          sequenceNo: Number(finalInvoice.sequence_no),
          variableSymbol: finalInvoice.variable_symbol,
          issueDateIso: String(finalInvoice.issue_date),
          dueDateIso: String(finalInvoice.due_date),
          currency: marketCurrency(market),
          market,
          kind: "FINAL",
          total: Number(finalInvoice.amount),
        });
        await sendEmail({
          to: refreshed.email,
          subject:
            market === "HU"
              ? `Vegszamla #${finalInvoice.invoice_no}`
              : `Factura finala #${finalInvoice.invoice_no}`,
          text:
            market === "HU"
              ? "A befizetes beazonositasa utan a vegszamlat mellekelten kuldjuk."
              : "Dupa confirmarea platii, factura finala este atasata acestui e-mail.",
          html: invoiceHtml,
          from: senderFrom,
          attachments: [
            {
              filename: `${finalInvoice.invoice_no}.html`,
              content: invoiceHtml,
              contentType: "text/html; charset=utf-8",
            },
            {
              filename: `${finalInvoice.invoice_no}.txt`,
              content: invoiceText,
              contentType: "text/plain; charset=utf-8",
            },
          ],
        }).catch(() => undefined);

        const paidEmail = buildPaymentReceivedEmail(refreshed, market);
        await sendEmail({
          to: refreshed.email,
          subject: paidEmail.subject,
          text: paidEmail.text,
          html: paidEmail.html,
          from: senderFrom,
        }).catch(() => undefined);
      }

      if (shouldCreateShipment) {
        await createShipmentForOrder(sql, refreshed, market, senderFrom, "status_transition_shipment");
      }
    }
  }

  return true;
}

export async function updateOrderTrackingNumber(orderId: string, trackingNumber: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const normalized = trackingNumber.trim();
  if (!normalized) return false;
  const rows = await sql`select * from orders where id = ${orderId} and market = ${market} limit 1`;
  if (rows.length === 0) return false;
  await sql`update orders set tracking_number = ${normalized} where id = ${orderId}`;
  const order = await getOrderById(orderId, market);
  if (!order) return false;
  const senderFrom = senderEmailForMarket(market);
  await insertAuditLog(sql, {
    market,
    action: "TRACKING_UPDATED",
    orderId,
    orderNumber: order.orderNumber,
    details: normalized,
  });
  const trackingEmail = buildTrackingEmail(order, market, normalized);
  await sendEmail({
    to: order.email,
    subject: trackingEmail.subject,
    text: trackingEmail.text,
    html: trackingEmail.html,
    from: senderFrom,
  }).catch(() => undefined);
  return true;
}

export async function triggerShipmentCreation(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order) return false;
  if (!(order.shippingCarrier === "PPL" || order.shippingCarrier === "DPD")) return false;
  if (order.shippingCarrier === "PPL" && (order.pplBatchId || order.trackingNumber)) {
    const refreshed = await syncPplBatch(orderId, market);
    return refreshed.ok;
  }
  if (order.shippingCarrier === "DPD" && (order.dpdShipmentId || order.trackingNumber)) {
    return refreshDpdShipment(orderId, market);
  }
  const senderFrom = senderEmailForMarket(market);
  await createShipmentForOrder(sql, order, market, senderFrom, "manual_debug_trigger");
  return true;
}

export async function getPplShipmentsAdmin(market: Market = "RO", limit = 200) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql`
    select *
    from orders
    where market = ${market} and shipping_carrier = 'PPL'
    order by created_at desc
    limit ${Math.max(1, Math.min(limit, 1000))}
  `;
  return rows.map((r) => toOrder(r as unknown as Row));
}

export async function syncPplBatch(
  orderId: string,
  market: Market = "RO",
  options?: { skipLabelPersistence?: boolean }
): Promise<{
  ok: boolean;
  processing?: boolean;
  labelReady?: boolean;
  trackingNumber?: string | null;
  message: string;
}> {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order) return { ok: false, message: "Objednavka nenalezena." };
  const batchId = order.pplBatchId || (isUuidLike(order.pplShipmentId) ? order.pplShipmentId : null);
  const knownShipmentNumber = numericTrackingOrNull(order.pplShipmentId) || numericTrackingOrNull(order.trackingNumber) || null;
  if (!batchId && !knownShipmentNumber) return { ok: false, message: "Chybi pplBatchId i trackingNumber." };
  const referenceId = String(order.pplOrderReference || order.orderNumber);
  let importState = String(order.pplImportState || "").trim();
  let trackingCandidate = knownShipmentNumber;
  let shipmentState: string | null = null;
  let labelUrl: string | null = order.pplLabelUrl || null;
  let completeLabelUrl: string | null = order.pplCompleteLabelUrl || null;
  let bulkLabelUrls: string[] = [];
  if (batchId) {
    const statusFromBatch = await fetchPplBatchStatus(batchId);
    if (!statusFromBatch.ok) {
      const statusMatch = /ppl_api_http_(\d+)/.exec(statusFromBatch.reason || "");
      await sql`
        update orders
        set
          ppl_batch_id = ${batchId},
          ppl_last_http_status = ${statusMatch ? Number(statusMatch[1]) : null},
          ppl_shipment_status = 'PPL_PROCESSING',
          ppl_last_error = ${shipmentErrorStatus(statusFromBatch.reason, statusFromBatch.raw)},
          ppl_raw_batch_status_response = ${jsonForDb({ reason: statusFromBatch.reason, raw: statusFromBatch.raw })}
        where id = ${orderId}
      `;
      return {
        ok: true,
        processing: true,
        trackingNumber: trackingCandidate,
        message: `Zasilka se stale zpracovava (batch=${batchId}, posledni_http=${statusMatch ? Number(statusMatch[1]) : "-"})`,
      };
    } else {
      const batchRaw = statusFromBatch.data.raw && typeof statusFromBatch.data.raw === "object"
        ? (statusFromBatch.data.raw as Record<string, unknown>)
        : {};
      const items = Array.isArray(batchRaw.items) ? batchRaw.items : [];
      const matchedItem =
        items.find((it) => {
          const rec = it as Record<string, unknown>;
          const ref = String(rec?.referenceId || "").trim();
          return ref === String(order.orderNumber) || ref === referenceId;
        }) || null;
      const item =
        matchedItem ||
        (items.length === 1
          ? items[0]
          : null);
      const itemRec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      importState = String(itemRec.importState || "").trim();
      if (!importState) {
        importState = String(batchRaw.importState || statusFromBatch.data.state || "").trim();
      }
      const preferredPath = String(order.trackingNumberJsonPath || "").trim();
      const preferredValue =
        (preferredPath ? getByJsonPath(batchRaw, preferredPath) : undefined) ??
        (preferredPath ? getByJsonPath(itemRec, preferredPath) : undefined);
      labelUrl = String(itemRec.labelUrl || "").trim() || labelUrl;
      const completeLabel = batchRaw.completeLabel && typeof batchRaw.completeLabel === "object"
        ? (batchRaw.completeLabel as Record<string, unknown>)
        : {};
      const labelUrlsArr = Array.isArray(completeLabel.labelUrls) ? completeLabel.labelUrls : [];
      bulkLabelUrls = labelUrlsArr.map((x) => String(x || "").trim()).filter(Boolean);
      completeLabelUrl = bulkLabelUrls[0] || completeLabelUrl;
      const batchOwnership = validatePplShipmentBelongsToOrder(
        {
          orderNumber: order.orderNumber,
          pplOrderReference: order.pplOrderReference,
          customerName: order.customerName,
          deliveryAddress: order.deliveryAddress,
          totalPrice: order.totalPrice,
        },
        itemRec,
        "batch"
      );
      if (batchOwnership.ok && /^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState)) {
        trackingCandidate =
          numericTrackingOrNull(String(itemRec.shipmentNumber || "").trim()) ||
          numericTrackingOrNull(String(preferredValue || "").trim()) ||
          trackingCandidate;
      }

      const errorDetails = jsonForDb({
        errors: itemRec.errors || null,
        relatedItems: itemRec.relatedItems || null,
        raw: itemRec,
      });
      await sql`
        update orders
        set
          ppl_batch_id = ${batchId},
          ppl_order_reference = ${referenceId},
          ppl_import_state = ${importState || null},
          ppl_shipment_status = ${
            /^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState)
              ? "PPL_COMPLETE"
              : /^(ERROR|FAILED)$/i.test(importState)
                ? "PPL_ERROR"
                : "PPL_PROCESSING"
          },
          ppl_last_http_status = 200,
          ppl_last_error = ${
            /^(ERROR|FAILED)$/i.test(importState)
              ? shipmentErrorStatus("ppl_batch_error", errorDetails)
              : null
          },
          ppl_raw_batch_status_response = ${jsonForDb(batchRaw)},
          ppl_label_url = ${labelUrl || null},
          ppl_complete_label_url = ${completeLabelUrl || null},
          ppl_bulk_label_urls = ${bulkLabelUrls.length > 0 ? jsonForDb(bulkLabelUrls) : null}
        where id = ${orderId}
      `;
      if (/^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState) && trackingCandidate) {
        await persistPplTrackingResult(sql, orderId, {
          trackingNumber: trackingCandidate,
          importState: "Complete",
          labelUrl,
          completeLabelUrl,
          rawBatch: batchRaw,
        });
      }
      if (!/^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState) && !/^(ERROR|FAILED)$/i.test(importState)) {
        return {
          ok: true,
          processing: true,
          trackingNumber: trackingCandidate,
          message: "Zasilka se stale zpracovava, zkuste refresh za chvili.",
        };
      }
      if (/^(ERROR|FAILED)$/i.test(importState)) {
        return { ok: false, message: "PPL vratilo chybu importu.", processing: false };
      }
    }
  }

  if (!trackingCandidate) {
    const created = new Date(order.createdAt);
    const dateFrom = new Date(created.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const dateTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const codVarSym = String(order.orderNumber).replace(/\D+/g, "").slice(-10);
    const fromShipmentFilters = await fetchPplShipmentByFilters({
      customerReference: null,
      variableSymbol: codVarSym || null,
      dateFromIso: dateFrom,
      dateToIso: dateTo,
    });
    if (fromShipmentFilters.ok) {
      const lookupRec =
        fromShipmentFilters.data.raw && typeof fromShipmentFilters.data.raw === "object"
          ? (fromShipmentFilters.data.raw as Record<string, unknown>)
          : {};
      const valid = validatePplShipmentBelongsToOrder(
        {
          orderNumber: order.orderNumber,
          pplOrderReference: order.pplOrderReference,
          customerName: order.customerName,
          deliveryAddress: order.deliveryAddress,
          totalPrice: order.totalPrice,
        },
        lookupRec,
        "shipment_lookup",
        codVarSym
      );
      if (valid.ok) {
        trackingCandidate = numericTrackingOrNull(fromShipmentFilters.data.trackingNumber) || trackingCandidate;
        shipmentState = fromShipmentFilters.data.state || shipmentState;
        await sql`update orders set ppl_raw_shipment_response = ${jsonForDb(fromShipmentFilters.data.raw)} where id = ${orderId}`;
      }
    }
  }
  if (!trackingCandidate) {
    const fromOrder = await fetchPplOrderInfoByCustomerReference(referenceId);
    await sql`update orders set ppl_raw_order_response = ${jsonForDb(fromOrder.ok ? fromOrder.data.raw : fromOrder)} where id = ${orderId}`;
    if (fromOrder.ok) {
      trackingCandidate = numericTrackingOrNull(fromOrder.data.shipmentNumbers[0]) || null;
    }
  }

  await sql`
    update orders
    set
      ppl_shipment_id = ${trackingCandidate},
      tracking_number = ${trackingCandidate},
      ppl_shipment_state = ${shipmentState || null},
      ppl_order_reference = ${referenceId},
      ppl_import_state = ${importState || null},
      ppl_last_http_status = ${/^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState) ? 200 : order.pplLastHttpStatus || null},
      ppl_last_error = ${/^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState) ? null : order.pplLastError || null},
      ppl_shipment_status = ${
        /^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState) && trackingCandidate
          ? "PPL_TRACKING_READY"
          : /^(COMPLETE|COMPLETED|SUCCESS)$/i.test(importState)
            ? "PPL_COMPLETE"
            : order.pplShipmentStatus || null
      }
    where id = ${orderId}
  `;
  if (trackingCandidate) {
    const byNumber = await fetchPplShipmentInfoByNumber(trackingCandidate);
    await sql`update orders set ppl_raw_shipment_response = ${jsonForDb(byNumber.ok ? byNumber.data.raw : byNumber)} where id = ${orderId}`;
    if (byNumber.ok) {
      await sql`
        update orders
        set ppl_shipment_state = ${byNumber.data.state || shipmentState || null}
        where id = ${orderId}
      `;
    }
  }
  const refreshedOrder = await getOrderById(orderId, market);
  const isComplete = /^(COMPLETE|COMPLETED|SUCCESS)$/i.test(String(importState || ""));
  if (refreshedOrder && isComplete && !refreshedOrder.pplLabelPath && !options?.skipLabelPersistence) {
    await savePplLabelFromBatch(sql, refreshedOrder, market).catch(() => null);
  }
  const latest = await getOrderById(orderId, market);
  const processing = !isComplete;
  if (processing) {
    return {
      ok: true,
      processing: true,
      labelReady: Boolean(latest?.pplLabelPath),
      trackingNumber: latest?.trackingNumber || null,
      message: `Zasilka se stale zpracovava (batch=${batchId || "-"}, importState=${importState || "-"})`,
    };
  }
  await sql`update orders set ppl_shipment_status = 'PPL_TRACKING_READY' where id = ${orderId}`;
  return {
    ok: true,
    processing: false,
    labelReady: true,
    trackingNumber: latest?.trackingNumber || null,
    message: "PPL zasilka synchronizovana.",
  };
}

export async function refreshPplShipment(orderId: string, market: Market = "RO") {
  const result = await syncPplBatch(orderId, market);
  return result.ok;
}

export async function debugFindPplTrackingNumber(
  orderId: string,
  knownTrackingNumber = "21491971453",
  market: Market = "RO"
): Promise<{
  ok: boolean;
  knownTrackingNumber: string;
  found: boolean;
  saved: boolean;
  matches: Array<{ source: string; path: string; value: string | number }>;
  requests: Array<PplDebugRequestResult & { step: string }>;
  trackingNumberCandidates: Array<{ source: string; path: string; value: string | number }>;
  rejectedTrackingCandidates?: Array<{ source: string; value: string | number; reason: string }>;
  selectedTrackingCandidate?: { source: string; path: string; value: string; reason: string } | null;
  cachedVsCurrent?: Record<string, unknown>;
}> {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order) {
    return { ok: false, knownTrackingNumber, found: false, saved: false, matches: [], requests: [], trackingNumberCandidates: [] };
  }

  const created = new Date(order.createdAt);
  const dateFrom = new Date(created.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const dateTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const referenceId = String(order.pplOrderReference || order.orderNumber);
  const customerReference = String(order.orderNumber);
  const codVarSym = String(order.orderNumber).replace(/\D+/g, "").slice(-10);
  const recipientZip = parseRecipientZip(order.deliveryAddress);
  const requests: Array<PplDebugRequestResult & { step: string }> = [];

  async function run(step: string, path: string, query: Record<string, string | number | Array<string | number>>) {
    const res = await pplDebugGet(path, query);
    requests.push({ ...res, step });
  }

  if (order.pplBatchId) {
    await run("A_batch_status", `/shipment/batch/${encodeURIComponent(order.pplBatchId)}`, {});
    await run("B_batch_label", `/shipment/batch/${encodeURIComponent(order.pplBatchId)}/label`, {
      pageSize: "A4",
      position: 1,
      limit: 200,
      offset: 0,
    });
  }
  if (referenceId) await run("C_order_by_reference", "/order", { OrderReferences: [referenceId], Limit: 100, Offset: 0 });
  if (customerReference) await run("D_order_by_customer_reference", "/order", { CustomerReferences: [customerReference], Limit: 100, Offset: 0 });
  if (order.pplOrderNumber) await run("E_order_by_order_number", "/order", { OrderNumbers: [order.pplOrderNumber], Limit: 100, Offset: 0 });
  await run("F_order_by_date_range", "/order", { DateFrom: dateFrom, DateTo: dateTo, Limit: 100, Offset: 0 });
  await run("G_shipment_by_known_number", "/shipment", { ShipmentNumbers: [knownTrackingNumber], Limit: 100, Offset: 0 });
  if (customerReference) {
    await run("H_shipment_by_customer_reference", "/shipment", {
      CustomerReferences: [customerReference],
      DateFrom: dateFrom,
      DateTo: dateTo,
      Limit: 100,
      Offset: 0,
    });
  }
  if (codVarSym) {
    await run("I_shipment_by_variable_symbol", "/shipment", {
      VariableSymbols: [codVarSym],
      DateFrom: dateFrom,
      DateTo: dateTo,
      Limit: 100,
      Offset: 0,
    });
  }

  const matches: Array<{ source: string; path: string; value: string | number }> = [];
  const candidates: Array<{ source: string; path: string; value: string | number }> = [];
  const rejected: Array<{ source: string; value: string | number; reason: string }> = [];
  for (const req of requests) {
    const found = findValuePaths(req.data, knownTrackingNumber);
    for (const m of found) matches.push({ source: req.step, path: m.path, value: m.value });
    const vals = valuesWithPaths(req.data);
    for (const v of vals) {
      if (
        isLikelyPplTrackingNumber(v.value)
        && String(v.value) !== String(order.orderNumber)
        && String(v.value) !== String(referenceId)
      ) {
        candidates.push({ source: req.step, path: v.path, value: v.value });
      }
    }
  }

  let selected: { source: string; path: string; value: string; reason: string } | null = null;
  const batchReq = requests.find((r) => r.step === "A_batch_status");
  if (batchReq?.ok && batchReq.data && typeof batchReq.data === "object") {
    const rec = batchReq.data as Record<string, unknown>;
    const items = Array.isArray(rec.items) ? rec.items : [];
    const m = items.find((it) => {
      const r = it as Record<string, unknown>;
      const ref = String(r.referenceId || "").trim();
      return ref === String(order.orderNumber) || ref === String(order.pplOrderReference || order.orderNumber);
    }) as Record<string, unknown> | undefined;
    const shipment = m ? String(m.shipmentNumber || "").trim() : "";
    if (numericTrackingOrNull(shipment)) {
      selected = {
        source: "batch_status",
        path: "items[0].shipmentNumber",
        value: shipment,
        reason: `Matched current pplBatchId and referenceId ${String(order.pplOrderReference || order.orderNumber)}`,
      };
    }
  }
  if (!selected && matches.length > 0) {
    for (const m of matches) {
      if (m.source === "G_shipment_by_known_number") {
        rejected.push({
          source: m.source,
          value: m.value,
          reason: "Rejected: known tracking debug lookup is non-authoritative for saving",
        });
      }
    }
  }

  return {
    ok: true,
    knownTrackingNumber,
    found: Boolean(selected) || matches.length > 0,
    saved: false,
    matches,
    requests,
    trackingNumberCandidates: candidates,
    rejectedTrackingCandidates: rejected,
    selectedTrackingCandidate: selected,
    cachedVsCurrent: {
      cachedTrackingNumber: order.trackingNumber || null,
      currentBatchShipmentNumber: selected?.value || null,
      overwritten: false,
    },
  };
}

export async function ensurePplLabelForOrder(orderId: string, market: Market = "RO"): Promise<string | null> {
  const sql = getSql();
  await ensureSchema(sql);
  await syncPplBatch(orderId, market).catch(() => undefined);
  const order = await getOrderById(orderId, market);
  if (!order) return null;
  if (order.pplLabelPath) return order.pplLabelPath;
  return savePplLabelFromBatch(sql, order, market);
}

export async function cancelPplShipmentForOrder(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  let order = await getOrderById(orderId, market);
  if (!order) return false;
  let shipmentNumber = numericTrackingOrNull(order.pplShipmentId) || numericTrackingOrNull(order.trackingNumber);
  if (!shipmentNumber && order.pplBatchId) {
    await syncPplBatch(orderId, market).catch(() => undefined);
    order = (await getOrderById(orderId, market)) || order;
    shipmentNumber = numericTrackingOrNull(order.pplShipmentId) || numericTrackingOrNull(order.trackingNumber);
  }
  if (!shipmentNumber) {
    await sql`
      update orders
      set
        ppl_cancel_mode = 'ppl_cancel_failed_no_local_reset',
        ppl_cancel_attempted = false,
        ppl_cancel_http_status = null,
        ppl_cancel_response = 'Missing shipmentNumber for cancel',
        ppl_local_reset_done = false
      where id = ${orderId}
    `;
    return false;
  }
  const cancelled = await cancelPplShipment(shipmentNumber);
  if (!cancelled.ok) {
    const statusMatch = /ppl_api_http_(\d+)/.exec(cancelled.reason || "");
    await sql`
      update orders
      set
        ppl_shipment_status = ${shipmentErrorStatus(cancelled.reason, cancelled.raw)},
        ppl_cancel_mode = 'ppl_cancel_failed_no_local_reset',
        ppl_cancel_attempted = true,
        ppl_cancel_shipment_number = ${shipmentNumber},
        ppl_cancel_http_status = ${statusMatch ? Number(statusMatch[1]) : null},
        ppl_cancel_response = ${jsonForDb({ reason: cancelled.reason, raw: cancelled.raw })},
        ppl_local_reset_done = false
      where id = ${orderId}
    `;
    return false;
  }
  await sql`
    update orders
    set
      ppl_shipment_status = 'PPL_CANCELLED',
      ppl_cancel_mode = 'ppl_cancel_then_local_reset',
      ppl_cancel_attempted = true,
      ppl_cancel_shipment_number = ${shipmentNumber},
      ppl_cancel_http_status = 202,
      ppl_cancel_response = ${jsonForDb(cancelled)},
      ppl_local_reset_done = false
    where id = ${orderId}
  `;
  await resetPplFields(sql, orderId, "ppl_cancel_then_local_reset");
  return true;
}

export async function resetPplShipmentForOrder(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order) return false;
  await sql`
    update orders
    set
      ppl_cancel_mode = 'local_reset_only',
      ppl_cancel_attempted = false,
      ppl_cancel_shipment_number = null,
      ppl_cancel_http_status = null,
      ppl_cancel_response = null,
      ppl_local_reset_done = true,
      ppl_last_error = null
    where id = ${orderId}
  `;
  await resetPplFields(sql, orderId, "local_reset_only");
  return true;
}

// Backward-compatible alias; prefer resetPplShipmentForOrder for clarity.
export async function deletePplShipmentForOrder(orderId: string, market: Market = "RO") {
  return resetPplShipmentForOrder(orderId, market);
}

export async function orderPplPickup(
  market: Market = "RO",
  input?: {
    pickupDate: string;
    fromTime: string;
    toTime: string;
    contactName: string;
    phone: string;
    email: string;
    shipmentCount: number;
    note?: string;
  }
) {
  const sql = getSql();
  await ensureSchema(sql);
  const payload = input || {
    pickupDate: new Date().toISOString().slice(0, 10),
    fromTime: "09:00",
    toTime: "16:00",
    contactName: process.env.PPL_SENDER_NAME?.trim() || "Pickup Contact",
    phone: process.env.PPL_SENDER_PHONE?.trim() || "",
    email: process.env.PPL_SENDER_EMAIL?.trim() || senderEmailForMarket(market),
    shipmentCount: 1,
    note: "",
  };
  const result = await createPplPickup(market, payload);
  if (!result.ok) return { ok: false, message: shipmentErrorStatus(result.reason, result.raw) };
  const rawRec = result.data.raw && typeof result.data.raw === "object" ? (result.data.raw as Record<string, unknown>) : {};
  const statusRec =
    rawRec.status && typeof rawRec.status === "object"
      ? (rawRec.status as Record<string, unknown>)
      : {};
  const pickupOrderReference = String(
    (statusRec.data && typeof statusRec.data === "object" ? (statusRec.data as Record<string, unknown>).orderReference : "") || ""
  ).trim() || null;
  const pickupStatus = String(
    (statusRec.data && typeof statusRec.data === "object" ? (statusRec.data as Record<string, unknown>).state : "") || "ORDERED"
  ).trim() || "ORDERED";
  const pickupHttpStatus = Number(statusRec.httpStatus || 200) || 200;
  const pickupError = statusRec.ok === false ? shipmentErrorStatus(String(statusRec.reason || "ppl_pickup_status_error"), statusRec.raw) : null;
  const pickupSnapshot = persistCarrierApiSnapshot({
    carrier: "PPL",
    scope: "pickup_create",
    normalized: {
      batchId: result.data.pickupId,
      referenceId: result.data.pickupReference,
      customerReference: result.data.pickupCustomerReference,
      orderReference: pickupOrderReference,
      sendDate: payload.pickupDate,
      sendTimeFrom: payload.fromTime,
      sendTimeTo: payload.toTime,
      shipmentCount: payload.shipmentCount,
      status: pickupStatus,
    },
    raw: rawRec,
    httpStatus: pickupHttpStatus,
    error: pickupError,
  });
  await sql`
    insert into ppl_pickups (
      id, market, pickup_id, pickup_batch_id, pickup_reference, pickup_customer_reference, pickup_order_reference,
      pickup_send_date, pickup_send_time_from, pickup_send_time_to, shipment_count, pickup_http_status, pickup_last_error,
      raw_create_request, raw_create_response, raw_status_response, note, status
    )
    values (
      ${crypto.randomUUID()},
      ${market},
      ${result.data.pickupId},
      ${result.data.pickupId},
      ${result.data.pickupReference},
      ${result.data.pickupCustomerReference},
      ${pickupOrderReference},
      ${payload.pickupDate},
      ${payload.fromTime},
      ${payload.toTime},
      ${payload.shipmentCount},
      ${pickupHttpStatus},
      ${pickupError},
      ${jsonForDb(payload)},
      ${jsonForDb((pickupSnapshot.safeRaw as Record<string, unknown>).create || null)},
      ${jsonForDb((pickupSnapshot.safeRaw as Record<string, unknown>).status || statusRec)},
      ${String(payload.note || "").slice(0, 300) || null},
      ${pickupStatus}
    )
  `;
  return { ok: true, message: `Svoz objednan: ${result.data.pickupId}` };
}

export async function cancelPplPickupOrder(pickupId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const cleanId = String(pickupId || "").trim();
  if (!cleanId) return { ok: false, message: "Chybi pickupId" };
  const rows = await sql<PplPickupRow[]>`
    select * from ppl_pickups where market = ${market} and pickup_id = ${cleanId} order by created_at desc limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, message: "PPL svoz nebyl nalezen." };
  let customerReference = String(row.pickup_customer_reference || "").trim();
  let orderReference = String(row.pickup_order_reference || row.pickup_reference || "").trim();
  if (!customerReference && !orderReference) {
    const backfill = await backfillPplPickupReferences(cleanId, market);
    customerReference = String(backfill.pickupCustomerReference || "").trim();
    orderReference = String(backfill.pickupOrderReference || backfill.pickupReference || "").trim();
  }
  if (!customerReference && !orderReference) {
    return {
      ok: false,
      message:
        "PPL svoz nelze zrusit, chybi customerReference/orderReference vytvoreneho svozu." +
        ` Dostupna data: pickupId=${row.pickup_id || ""}, batchId=${row.pickup_batch_id || ""}, pickupReference=${row.pickup_reference || ""}, rawStatus=${String(row.raw_status_response || "").slice(0, 500)}`,
    };
  }
  const res = await cancelPplPickupByReference({
    customerReference: customerReference || null,
    orderReference: customerReference ? null : orderReference || null,
    note: "Cancelled from admin",
  });
  if (!res.ok) return { ok: false, message: shipmentErrorStatus(res.reason, res.raw) };
  await sql`
    update ppl_pickups
    set status = 'CANCELLED', pickup_http_status = 200, pickup_last_error = null
    where market = ${market} and pickup_id = ${cleanId}
  `;
  return { ok: true, message: `PPL svoz stornovan: ${cleanId}` };
}

export async function backfillPplPickupReferences(pickupId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const cleanId = String(pickupId || "").trim();
  const rows = await sql<PplPickupRow[]>`
    select * from ppl_pickups where market = ${market} and pickup_id = ${cleanId} order by created_at desc limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, message: "Pickup nebyl nalezen." };
  const batchId = String(row.pickup_batch_id || row.pickup_id || "").trim();
  if (!batchId) return { ok: false, message: "Pickup nema batchId pro backfill." };
  const statusRes = await fetchPplPickupBatchStatus(batchId);
  const statusRawValue = !statusRes.ok ? statusRes.raw : null;
  const statusRaw = statusRawValue && typeof statusRawValue === "object" ? (statusRawValue as Record<string, unknown>) : {};
  const statusData =
    statusRes.ok && statusRes.data && typeof statusRes.data === "object"
      ? (statusRes.data as Record<string, unknown>)
      : statusRaw.data && typeof statusRaw.data === "object"
        ? (statusRaw.data as Record<string, unknown>)
        : {};
  const pickupReference = String(statusData.referenceId || row.pickup_reference || "").trim() || null;
  const pickupCustomerReference = String(statusData.customerReference || row.pickup_customer_reference || "").trim() || null;
  const pickupOrderReference = String(statusData.orderReference || row.pickup_order_reference || "").trim() || null;
  const pickupState = String(statusData.state || statusData.importState || row.status || "ORDERED").trim() || "ORDERED";
  const snapshot = persistCarrierApiSnapshot({
    carrier: "PPL",
    scope: "pickup_backfill_status",
    normalized: {
      batchId,
      referenceId: pickupReference,
      customerReference: pickupCustomerReference,
      orderReference: pickupOrderReference,
      status: pickupState,
    },
    raw: statusRawValue || (statusRes.ok ? statusRes.data : null),
    httpStatus: statusRes.ok ? 200 : 500,
    error: statusRes.ok ? null : shipmentErrorStatus(statusRes.reason, statusRes.raw),
  });
  await sql`
    update ppl_pickups
    set
      pickup_reference = ${pickupReference},
      pickup_customer_reference = ${pickupCustomerReference},
      pickup_order_reference = ${pickupOrderReference},
      status = ${pickupState},
      pickup_http_status = ${statusRes.ok ? 200 : 500},
      pickup_last_error = ${statusRes.ok ? null : shipmentErrorStatus(statusRes.reason, statusRes.raw)},
      raw_status_response = ${jsonForDb(snapshot.safeRaw)}
    where market = ${market} and pickup_id = ${cleanId}
  `;
  return {
    ok: true,
    pickupReference,
    pickupCustomerReference,
    pickupOrderReference,
    batchId,
    state: pickupState,
    message: "Backfill hotov.",
  };
}

export async function getPplPickups(market: Market = "RO", limit = 50) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql<PplPickupRow[]>`
    select * from ppl_pickups
    where market = ${market}
    order by created_at desc
    limit ${Math.max(1, Math.min(limit, 200))}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    createdAt: new Date(String(r.created_at)).toISOString(),
    pickupId: String(r.pickup_id),
    note: r.note ? String(r.note) : null,
    status: String(r.status),
  }));
}

export async function getDpdShipmentsAdmin(market: Market = "RO", limit = 200) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql`
    select *
    from orders
    where market = ${market} and shipping_carrier = 'DPD'
    order by created_at desc
    limit ${Math.max(1, Math.min(limit, 1000))}
  `;
  return rows.map((r) => toOrder(r as unknown as Row));
}

export async function refreshDpdShipment(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order?.dpdShipmentId) return false;
  const res = await fetchDpdShipmentStatus(order.dpdShipmentId);
  if (!res.ok) {
    await sql`
      update orders
      set
        dpd_shipment_status = ${shipmentErrorStatus(res.reason, res.raw)},
        dpd_last_http_status = ${res.httpStatus || null},
        dpd_last_error = ${shipmentErrorStatus(res.reason, res.raw)},
        dpd_raw_status_response = ${jsonForDb(res.raw || null)}
      where id = ${orderId}
    `;
    return false;
  }
  const resolvedTracking = numericTrackingOrNull(res.data.trackingNumber) || numericTrackingOrNull(order.trackingNumber) || null;
  await sql`
    update orders
    set
      dpd_shipment_status = ${res.data.state || "UNKNOWN"},
      tracking_number = ${resolvedTracking},
      dpd_last_http_status = 200,
      dpd_last_error = null,
      dpd_raw_status_response = ${jsonForDb(res.data.raw || null)},
      dpd_tracking_source = ${resolvedTracking ? "shipment_status" : order.dpdTrackingSource || null},
      dpd_tracking_json_path = ${resolvedTracking ? "auto:parcelLabelNumber|parcelNumber|trackingNumber" : order.dpdTrackingJsonPath || null}
    where id = ${orderId}
  `;
  return true;
}

export async function cancelDpdShipmentForOrder(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  let order = await getOrderById(orderId, market);
  if (!order?.dpdShipmentId) return false;
  await refreshDpdShipment(orderId, market).catch(() => undefined);
  order = (await getOrderById(orderId, market)) || order;
  if (!order.dpdShipmentId) return false;
  const cancelled = await cancelDpdShipment(order.dpdShipmentId);
  if (!cancelled.ok) {
    await sql`
      update orders
      set
        dpd_shipment_status = ${shipmentErrorStatus(cancelled.reason, cancelled.raw)},
        dpd_cancel_mode = 'dpd_cancel_failed_no_local_reset',
        dpd_cancel_attempted = true,
        dpd_cancel_http_status = ${cancelled.httpStatus || null},
        dpd_cancel_response = ${jsonForDb(cancelled.raw || cancelled.reason)},
        dpd_local_reset_done = false,
        dpd_last_http_status = ${cancelled.httpStatus || null},
        dpd_last_error = ${shipmentErrorStatus(cancelled.reason, cancelled.raw)},
        dpd_raw_cancel_response = ${jsonForDb(cancelled.raw || null)}
      where id = ${orderId}
    `;
    return false;
  }
  await sql`
    update orders
    set
      dpd_shipment_status = 'CANCELLED',
      dpd_cancel_mode = 'dpd_cancel_then_local_reset',
      dpd_cancel_attempted = true,
      dpd_cancel_http_status = 200,
      dpd_cancel_response = ${jsonForDb(cancelled.data || null)},
      dpd_local_reset_done = false,
      dpd_last_http_status = 200,
      dpd_last_error = null,
      dpd_raw_cancel_response = ${jsonForDb(cancelled.data || null)}
    where id = ${orderId}
  `;
  await sql`
    update orders
    set
      dpd_shipment_id = null,
      dpd_shipment_status = null,
      dpd_label_path = null,
      dpd_last_http_status = null,
      dpd_last_error = null,
      dpd_raw_create_request = null,
      dpd_raw_create_response = null,
      dpd_raw_status_response = null,
      dpd_raw_label_response = null,
      tracking_number = null,
      dpd_tracking_source = null,
      dpd_tracking_json_path = null,
      dpd_local_reset_done = true
    where id = ${orderId}
  `;
  return true;
}

export async function resetDpdShipmentForOrder(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order) return false;
  await sql`
    update orders
    set
      dpd_shipment_id = null,
      dpd_shipment_status = null,
      dpd_label_path = null,
      dpd_last_http_status = null,
      dpd_last_error = null,
      dpd_raw_create_request = null,
      dpd_raw_create_response = null,
      dpd_raw_status_response = null,
      dpd_raw_label_response = null,
      dpd_raw_cancel_response = null,
      dpd_cancel_mode = 'local_reset_only',
      dpd_cancel_attempted = false,
      dpd_cancel_http_status = null,
      dpd_cancel_response = null,
      dpd_local_reset_done = true,
      tracking_number = null,
      dpd_tracking_source = null,
      dpd_tracking_json_path = null
    where id = ${orderId}
  `;
  return true;
}

export async function deleteDpdShipmentForOrder(orderId: string, market: Market = "RO") {
  return resetDpdShipmentForOrder(orderId, market);
}

export async function orderDpdPickup(
  market: Market = "RO",
  input: {
    pickupDate: string;
    fromTime: string;
    toTime: string;
    note?: string;
    contactName: string;
    phone: string;
    parcelCount: number;
    totalWeight: number;
  }
) {
  const sql = getSql();
  await ensureSchema(sql);
  const result = await createDpdPickup(market, input);
  if (!result.ok) return { ok: false, message: shipmentErrorStatus(result.reason, result.raw) };
  await sql`
    insert into dpd_pickups (id, market, pickup_id, pickup_date, note, status)
    values (
      ${crypto.randomUUID()},
      ${market},
      ${result.data.pickupId},
      ${result.data.pickupDate},
      ${String(input.note || "").slice(0, 300) || null},
      'ORDERED'
    )
  `;
  return { ok: true, message: `DPD svoz objednan: ${result.data.pickupId}` };
}

export async function getDpdPickups(market: Market = "RO", limit = 50) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql<DpdPickupRow[]>`
    select * from dpd_pickups
    where market = ${market}
    order by created_at desc
    limit ${Math.max(1, Math.min(limit, 200))}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    createdAt: new Date(String(r.created_at)).toISOString(),
    pickupId: String(r.pickup_id),
    pickupDate: r.pickup_date ? String(r.pickup_date) : null,
    note: r.note ? String(r.note) : null,
    status: String(r.status),
  }));
}

export async function cancelDpdPickupOrder(pickupId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const cleanId = String(pickupId || "").trim();
  if (!cleanId) return { ok: false, message: "Chybi pickupId" };
  const res = await cancelDpdPickup(cleanId);
  if (!res.ok) {
    return { ok: false, message: shipmentErrorStatus(res.reason, res.raw) };
  }
  await sql`
    update dpd_pickups
    set status = 'CANCELLED'
    where market = ${market} and pickup_id = ${cleanId}
  `;
  return { ok: true, message: `DPD svoz stornovan: ${cleanId}` };
}

export async function getDpdBulkLabelForOrders(orderIds: string[], market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  if (orderIds.length === 0) return { ok: false as const, reason: "no_orders_selected", failedOrders: [] as Array<{ orderId: string; reason: string }> };
  const rows = await sql`
    select * from orders
    where market = ${market}
      and id = any(${orderIds})
      and shipping_carrier = 'DPD'
      and dpd_shipment_id is not null
  `;
  const shipmentIds = rows
    .map((r) => String((r as Row).dpd_shipment_id || "").trim())
    .filter(Boolean);
  const missing = orderIds.filter((id) => !rows.some((r) => String((r as Row).id) === id));
  if (missing.length > 0) {
    return {
      ok: false as const,
      reason: "bulk_requires_all_orders_with_dpd_shipment_id",
      failedOrders: missing.map((orderId) => ({ orderId, reason: "missing_dpd_shipment_id" })),
      endpointAttemptResults: null,
    };
  }
  if (shipmentIds.length === 0) {
    return {
      ok: false as const,
      reason: "missing_dpd_shipment_ids",
      failedOrders: missing.map((orderId) => ({ orderId, reason: "missing_dpd_shipment_id" })),
    };
  }
  const labelRes = await fetchDpdLabelPdfForShipments(shipmentIds);
  if (!labelRes.ok) {
    return {
      ok: false as const,
      reason: labelRes.reason,
      failedOrders: missing.map((orderId) => ({ orderId, reason: "missing_dpd_shipment_id" })),
      endpointAttemptResults: labelRes.raw,
    };
  }
  return {
    ok: true as const,
    bytes: labelRes.data.bytes,
    contentType: labelRes.data.contentType,
    failedOrders: missing.map((orderId) => ({ orderId, reason: "missing_dpd_shipment_id" })),
    endpointAttemptResults: labelRes.data.attempt,
    fileName: `dpd-bulk-labels-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`,
  };
}

export async function getPplBulkLabelForOrders(orderIds: string[], market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  if (orderIds.length === 0) return null;
  const selectedRows = await sql`
    select * from orders
    where market = ${market}
      and id = any(${orderIds})
      and shipping_carrier = 'PPL'
  `;
  for (const row of selectedRows) {
    const order = toOrder(row as unknown as Row);
    if (!order.pplLabelPath) {
      await savePplLabelFromBatch(sql, order, market).catch(() => null);
    }
  }
  const rows = await sql`
    select * from orders
    where market = ${market}
      and id = any(${orderIds})
      and shipping_carrier = 'PPL'
      and ppl_label_path is not null
  `;
  const labelPaths = rows
    .map((r) => String((r as Row).ppl_label_path || "").trim())
    .filter(Boolean);
  if (labelPaths.length === 0) return null;
  const merged = await PDFDocument.create();
  for (const labelPath of labelPaths) {
    let bytes: Buffer | null = null;
    if (/^https?:\/\//i.test(labelPath)) {
      bytes = await fetch(labelPath)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((arr) => (arr ? Buffer.from(arr) : null))
        .catch(() => null);
    } else if (labelPath.startsWith("/")) {
      const absPath = path.resolve(process.cwd(), `.${labelPath}`);
      bytes = await readFile(absPath).catch(() => null);
    }
    if (!bytes) continue;
    const src = await PDFDocument.load(bytes).catch(() => null);
    if (!src) continue;
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach((p) => merged.addPage(p));
  }
  if (merged.getPageCount() === 0) return null;
  const relDir = process.env.PPL_LABEL_SAVE_DIR?.trim() || "public/ppl-labels";
  const absDir = path.resolve(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const fileName = `${market.toLowerCase()}-bulk-${Date.now()}.pdf`;
  const outPath = path.join(absDir, fileName);
  const outBytes = await merged.save();
  await writeFile(outPath, Buffer.from(outBytes));
  if (relDir.startsWith("public/")) {
    const publicPrefix = relDir.replace(/^public\//, "");
    return `/${publicPrefix}/${fileName}`;
  }
  return null;
}

export async function regenerateDpdLabelForOrder(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order?.dpdShipmentId) return null;
  const built = await fetchDpdLabelPdfForShipments([order.dpdShipmentId]);
  if (!built.ok) {
    await sql`
      update orders
      set
        dpd_last_http_status = ${built.httpStatus || null},
        dpd_last_error = ${shipmentErrorStatus(built.reason, built.raw)},
        dpd_raw_label_response = ${jsonForDb({ ok: false, reason: built.reason, raw: built.raw })}
      where id = ${orderId}
    `;
    return null;
  }
  await sql`
    update orders
    set
      dpd_last_http_status = 200,
      dpd_last_error = null,
      dpd_raw_label_response = ${jsonForDb({
        ok: true,
        contentType: built.data.contentType,
        contentLength: built.data.bytes.length,
        endpointAttemptResults: built.data.attempt,
      })}
    where id = ${orderId}
  `;
  return built.data.bytes;
}

export async function getRecentAdminAuditLogs(market: Market = "RO", limit = 25) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql<AdminAuditRow[]>`
    select * from admin_audit_logs
    where market = ${market}
    order by created_at desc
    limit ${Math.max(1, Math.min(200, limit))}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    createdAt: new Date(String(r.created_at)).toISOString(),
    market: String(r.market) as Market,
    action: String(r.action),
    orderId: r.order_id ? String(r.order_id) : null,
    orderNumber: r.order_number != null ? Number(r.order_number) : null,
    details: r.details ? String(r.details) : null,
  }));
}

export async function getLatestInvoiceByOrderNumber(orderNumber: number, market: Market, kind: InvoiceKind) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql<InvoiceRow[]>`
    select i.*
    from invoices i
    join orders o on o.id = i.order_id
    where o.order_number = ${orderNumber} and o.market = ${market} and i.kind = ${kind}
    order by i.created_at desc
    limit 1
  `;
  return rows[0] || null;
}

export async function hardDeleteOrderWithCarrierCancel(orderId: string, market: Market = "RO") {
  const sql = getSql();
  await ensureSchema(sql);
  const order = await getOrderById(orderId, market);
  if (!order) return { ok: false, message: "Objednavka nenalezena." };

  const hasPpl = Boolean(order.pplBatchId || order.pplShipmentId || (order.shippingCarrier === "PPL" && order.trackingNumber));
  if (hasPpl) {
    const ok = await cancelPplShipmentForOrder(orderId, market);
    if (!ok) return { ok: false, message: "Hard delete zastaven: nepodarilo se stornovat PPL zasilku." };
  }

  const hasDpd = Boolean(order.dpdShipmentId || (order.shippingCarrier === "DPD" && order.trackingNumber));
  if (hasDpd) {
    const ok = await cancelDpdShipmentForOrder(orderId, market);
    if (!ok) return { ok: false, message: "Hard delete zastaven: nepodarilo se stornovat DPD zasilku." };
  }

  try {
    await sql`delete from admin_audit_logs where order_id = ${orderId}`;
  } catch {
    // optional table
  }
  const deleted = await sql`delete from orders where id = ${orderId} and market = ${market}`;
  if (deleted.count === 0) return { ok: false, message: "Objednavku se nepodarilo smazat." };
  return { ok: true, message: "Objednavka byla trvale smazana." };
}

export async function hardDeleteOrdersBulk(orderIds: string[], market: Market = "RO") {
  const deletedOrders: string[] = [];
  const failedOrders: Array<{ orderId: string; reason: string }> = [];
  const carrierCancelAttempts: Array<{ orderId: string; carrier: "PPL" | "DPD"; ok: boolean; reason?: string }> = [];
  for (const orderId of orderIds.map((x) => String(x || "").trim()).filter(Boolean)) {
    const order = await getOrderById(orderId, market);
    if (!order) {
      failedOrders.push({ orderId, reason: "order_not_found" });
      continue;
    }
    if (order.pplBatchId || order.pplShipmentId || (order.shippingCarrier === "PPL" && order.trackingNumber)) {
      const ok = await cancelPplShipmentForOrder(orderId, market);
      carrierCancelAttempts.push({ orderId, carrier: "PPL", ok, reason: ok ? undefined : "ppl_cancel_failed" });
      if (!ok) {
        failedOrders.push({ orderId, reason: "ppl_cancel_failed" });
        continue;
      }
    }
    if (order.dpdShipmentId || (order.shippingCarrier === "DPD" && order.trackingNumber)) {
      const ok = await cancelDpdShipmentForOrder(orderId, market);
      carrierCancelAttempts.push({ orderId, carrier: "DPD", ok, reason: ok ? undefined : "dpd_cancel_failed" });
      if (!ok) {
        failedOrders.push({ orderId, reason: "dpd_cancel_failed" });
        continue;
      }
    }
    const one = await hardDeleteOrderWithCarrierCancel(orderId, market);
    if (one.ok) deletedOrders.push(orderId);
    else failedOrders.push({ orderId, reason: one.message });
  }
  return {
    ok: failedOrders.length === 0,
    deletedOrders,
    failedOrders,
    carrierCancelAttempts,
    message: failedOrders.length === 0 ? "Bulk hard delete dokoncen." : "Nektere objednavky nesly smazat.",
  };
}
