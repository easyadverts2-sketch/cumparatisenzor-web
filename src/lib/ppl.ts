import type { Market, Order } from "./types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type PplResult =
  | {
      ok: true;
      shipmentNumber: string | null;
      batchId: string | null;
      referenceId: string;
      labelPublicPath?: string | null;
      locationHeader?: string | null;
      createRequest?: unknown;
      raw?: unknown;
    }
  | { ok: false; reason: string; raw?: unknown };

type PplGenericResult<T> = { ok: true; data: T } | { ok: false; reason: string; raw?: unknown };
export type PplDebugRequestResult = {
  ok: boolean;
  method: "GET";
  url: string;
  query: Record<string, string | number | Array<string | number>>;
  status: number | null;
  headers: Record<string, string>;
  data: unknown;
  error: string | null;
  durationMs: number;
  correlationId: string | null;
};

function isEnabled() {
  return process.env.PPL_API_ENABLED === "true";
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

export function buildPplBatchLabelFallbackUrl(baseUrl: string, batchId: string): string {
  return (
    `${normalizeBaseUrl(baseUrl)}/shipment/batch/${encodeURIComponent(batchId)}/label` +
    `?pageSize=A4&position=1&limit=200&offset=0`
  );
}

export function resolvePplLabelEndpoint(baseUrl: string, labelUrl: string): string {
  const raw = String(labelUrl || "").trim();
  if (!raw) return "";
  const base = new URL(normalizeBaseUrl(baseUrl));
  if (/^https?:\/\//i.test(raw)) {
    try {
      const absolute = new URL(raw);
      const sameHost = absolute.protocol === "https:" && absolute.host === base.host;
      return sameHost ? absolute.toString() : "";
    } catch {
      return "";
    }
  }
  const resolved = new URL(raw.startsWith("/") ? raw : `/${raw}`, base);
  if (resolved.protocol !== "https:" || resolved.host !== base.host) return "";
  return resolved.toString();
}

function normalizePplText(input: unknown, maxLen = 250): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function buildApiPath(template: string, shipmentId?: string) {
  if (!shipmentId) return template;
  return template.replaceAll("{id}", encodeURIComponent(shipmentId));
}

function extractBatchId(rawRec: Record<string, unknown>, location: string): string {
  const fromBody = String(rawRec.batchId || rawRec.id || "").trim();
  if (fromBody) return fromBody;
  if (!location) return "";
  try {
    const u = new URL(location);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.at(-1) || "";
  } catch {
    const clean = location.split("?")[0];
    const parts = clean.split("/").filter(Boolean);
    return parts.at(-1) || "";
  }
}

function codVarSymFromOrderNumber(orderNumber: number): string {
  const digits = String(orderNumber).replace(/\D+/g, "");
  const trimmed = digits.length <= 10 ? digits : digits.slice(-10);
  if (trimmed) return trimmed;
  return String(Date.now()).replace(/\D+/g, "").slice(-10) || "1";
}

function extractShipmentNumberFromAny(source: Record<string, unknown>): string {
  const direct = String(
    source.shipmentNumber || source.parcelNumber || source.parcelId || source.shipmentId || ""
  ).trim();
  if (/^[0-9]{8,20}$/.test(direct)) return direct;

  const items = Array.isArray(source.items) ? (source.items as Array<unknown>) : [];
  for (const item of items) {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const num = String(
        rec.shipmentNumber || rec.parcelNumber || rec.parcelId || rec.shipmentId || ""
      ).trim();
      if (/^[0-9]{8,20}$/.test(num)) return num;
    }
  }
  return "";
}

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const s = String(value || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function pplLabelReturnEmail(market: Market): string {
  if (market === "HU") {
    return (
      process.env.PPL_LABEL_EMAIL_HU?.trim() ||
      process.env.PPL_LABEL_EMAIL?.trim() ||
      process.env.INTERNAL_ORDER_EMAIL_HU?.trim() ||
      process.env.INTERNAL_ORDER_EMAIL?.trim() ||
      "info@szenzorvasarlas.hu"
    );
  }
  return (
    process.env.PPL_LABEL_EMAIL_RO?.trim() ||
    process.env.PPL_LABEL_EMAIL?.trim() ||
    process.env.INTERNAL_ORDER_EMAIL_RO?.trim() ||
    process.env.INTERNAL_ORDER_EMAIL?.trim() ||
    "info@cumparatisenzor.ro"
  );
}

/** PPL CPL expects ISO 3166-1 alpha-2 (e.g. CZ), not full country names. */
function normalizeKeyForCountryAlias(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePplSenderCountryIso2(raw: string | undefined): string | null {
  const t = (raw || "").trim();
  if (!t) return "CZ";
  const compact = t.toUpperCase().replace(/\s+/g, "");
  if (/^[A-Z]{2}$/.test(compact)) return compact;
  const alpha3: Record<string, string> = {
    CZE: "CZ",
    SVK: "SK",
    ROU: "RO",
    HUN: "HU",
    POL: "PL",
    DEU: "DE",
    AUT: "AT",
  };
  if (compact.length === 3 && alpha3[compact]) return alpha3[compact];

  const key = normalizeKeyForCountryAlias(t);
  const aliases: Record<string, string> = {
    cz: "CZ",
    "czech republic": "CZ",
    czechia: "CZ",
    cesko: "CZ",
    cr: "CZ",
    romania: "RO",
    "united kingdom": "GB",
    uk: "GB",
    "great britain": "GB",
    england: "GB",
    hungary: "HU",
    magyarorszag: "HU",
    slovakia: "SK",
    slovensko: "SK",
    poland: "PL",
    polska: "PL",
    germany: "DE",
    deutschland: "DE",
    austria: "AT",
    osterreich: "AT",
  };
  if (aliases[key]) return aliases[key];
  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseAddressLine(deliveryAddress: string) {
  const lines = deliveryAddress
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lineWithCommas = lines.find((line) => line.includes(",")) || "";
  const parts = lineWithCommas.split(",").map((x) => x.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const zipCode = (parts[2] || "").replace(/[^\d]/g, "");
  return { street, city, zipCode };
}

/**
 * COD is only valid with COD-capable product types (e.g. COND, DOPD, SMED — not CONN).
 * @see PPL CPL CashOnDeliveryFeatureModel / shipment batch docs.
 */
function productTypeForMarket(market: Market, paymentMethod: Order["paymentMethod"]) {
  if (paymentMethod === "COD") {
    if (market === "HU") {
      return (
        process.env.PPL_PRODUCT_TYPE_COD_HU?.trim() ||
        process.env.PPL_PRODUCT_TYPE_COD_INTL?.trim() ||
        process.env.PPL_PRODUCT_TYPE_COD?.trim() ||
        "COND"
      );
    }
    if (market === "RO") {
      return (
        process.env.PPL_PRODUCT_TYPE_COD_RO?.trim() ||
        process.env.PPL_PRODUCT_TYPE_COD_INTL?.trim() ||
        process.env.PPL_PRODUCT_TYPE_COD?.trim() ||
        "COND"
      );
    }
    return process.env.PPL_PRODUCT_TYPE_COD?.trim() || "COND";
  }
  if (market === "HU") {
    return process.env.PPL_PRODUCT_TYPE_HU?.trim() || process.env.PPL_PRODUCT_TYPE_INTL?.trim() || "CONN";
  }
  if (market === "RO") {
    return process.env.PPL_PRODUCT_TYPE_RO?.trim() || process.env.PPL_PRODUCT_TYPE_INTL?.trim() || "CONN";
  }
  return process.env.PPL_PRODUCT_TYPE?.trim() || "BUSS";
}

const SHOP_CURRENCY: Record<Market, string> = { HU: "HUF", RO: "RON" };

/**
 * COD settlement currency/amount sent to PPL.
 * Default is shop currency (HU => HUF, RO => RON); override only if your PPL account requires it.
 */
function pplCodSettlementAmount(
  market: Market,
  totalPriceShopCurrency: number
): { ok: true; currency: string; amount: number } | { ok: false; reason: string } {
  const shop = SHOP_CURRENCY[market];
  const fromMarketEnv =
    market === "HU"
      ? process.env.PPL_COD_CURRENCY_HU?.trim()
      : market === "RO"
        ? process.env.PPL_COD_CURRENCY_RO?.trim()
        : undefined;
  const fromGlobal = process.env.PPL_COD_CURRENCY?.trim();
  const settlement = (
    fromMarketEnv ||
    fromGlobal ||
    shop
  ).toUpperCase();

  if (settlement === shop) {
    return { ok: true, currency: settlement, amount: totalPriceShopCurrency };
  }

  if (market === "HU" && settlement === "CZK") {
    const hufPerCzk = Number(process.env.PPL_COD_HUF_PER_CZK?.trim());
    if (!Number.isFinite(hufPerCzk) || hufPerCzk <= 0) {
      return { ok: false, reason: "ppl_cod_huf_per_czk_required" };
    }
    const amount = Math.round((totalPriceShopCurrency / hufPerCzk) * 100) / 100;
    return { ok: true, currency: "CZK", amount };
  }

  const mult = Number(process.env.PPL_COD_FX_MULTIPLIER?.trim());
  if (!Number.isFinite(mult) || mult <= 0) {
    return { ok: false, reason: "ppl_cod_fx_multiplier_required" };
  }
  const amount = Math.round(totalPriceShopCurrency * mult * 100) / 100;
  return { ok: true, currency: settlement, amount };
}

/** CPL `ConstPageSize` enum is only `Default` | `A4` (no A6). Default ≈ 150×100 mm; A4 = 4 positions per sheet. */
function pplCompleteLabelPageSize(): "Default" | "A4" {
  const raw = (process.env.PPL_LABEL_PAGE_SIZE || "Default").trim().toLowerCase();
  if (raw === "a4") return "A4";
  if (raw === "default" || raw === "") return "Default";
  if (raw === "a6" || raw === "a5") return "Default";
  return "Default";
}

function firstLabelUrl(pollRaw: Record<string, unknown>): string | null {
  const completeLabel = toRecord(pollRaw.completeLabel);
  const urls = Array.isArray(completeLabel.labelUrls) ? completeLabel.labelUrls : [];
  if (urls.length > 0 && urls[0]) {
    return String(urls[0]);
  }
  const items = Array.isArray(pollRaw.items) ? pollRaw.items : [];
  if (items.length > 0) {
    const firstItem = toRecord(items[0]);
    if (firstItem.labelUrl) {
      return String(firstItem.labelUrl);
    }
  }
  return null;
}

async function downloadAndSaveLabelPdf(params: {
  labelUrl: string;
  token: string;
  orderNumber: number;
  market: Market;
  shipmentId: string;
}): Promise<string | null> {
  const res = await fetch(params.labelUrl, {
    headers: { Authorization: `Bearer ${params.token}` },
  });
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("pdf")) return null;

  const bytes = Buffer.from(await res.arrayBuffer());
  const relDir = process.env.PPL_LABEL_SAVE_DIR?.trim() || "public/ppl-labels";
  const absDir = path.resolve(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const fileName = `${params.market.toLowerCase()}-${String(params.orderNumber)}-${params.shipmentId}.pdf`;
  const absPath = path.join(absDir, fileName);
  await writeFile(absPath, bytes);

  if (relDir.startsWith("public/")) {
    const publicPrefix = relDir.replace(/^public\//, "");
    return `/${publicPrefix}/${fileName}`;
  }
  return null;
}

async function requestToken(baseUrl: string): Promise<string | null> {
  const staticToken = process.env.PPL_API_TOKEN?.trim();
  if (staticToken) return staticToken;

  const tokenUrl =
    process.env.PPL_API_TOKEN_URL?.trim() || `${normalizeBaseUrl(baseUrl)}/login/getAccessToken`;
  const clientId = process.env.PPL_API_CLIENT_ID?.trim();
  const clientSecret = process.env.PPL_API_CLIENT_SECRET?.trim();
  const username = process.env.PPL_API_USERNAME?.trim();
  const password = process.env.PPL_API_PASSWORD?.trim();

  // Preferred CPL OAuth2 flow (client_credentials)
  if (clientId && clientSecret) {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: process.env.PPL_API_SCOPE?.trim() || "myapi2",
    });
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (res.ok) {
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const token = String(raw.access_token || raw.token || "");
      if (token) return token;
    }
  }

  // Fallback for accounts where token endpoint uses username/password payload.
  if (username && password) {
    const tryBodies: Array<{ headers: Record<string, string>; body: string }> = [
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "password",
          username,
          password,
        }).toString(),
      },
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    ];
    for (const attempt of tryBodies) {
      const res = await fetch(tokenUrl, { method: "POST", headers: attempt.headers, body: attempt.body });
      if (res.ok) {
        const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const token = String(raw.access_token || raw.token || "");
        if (token) return token;
      }
    }
  }
  return null;
}

async function pplJsonRequest<T>(
  method: "GET" | "POST",
  pathTemplate: string,
  body?: Record<string, unknown>,
  shipmentId?: string
): Promise<PplGenericResult<T>> {
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) return { ok: false, reason: "ppl_api_not_configured" };
  const token = await requestToken(baseUrl);
  if (!token) return { ok: false, reason: "ppl_api_token_failed" };
  const path = buildApiPath(pathTemplate, shipmentId);
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const rawText = await res.text().catch(() => "");
  let parsed: unknown = {};
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }
  if (!res.ok) {
    return { ok: false, reason: `ppl_api_http_${res.status}`, raw: parsed };
  }
  return { ok: true, data: parsed as T };
}

async function pplGetJson<T>(
  path: string,
  query?: Record<string, string | number | Array<string | number>>
): Promise<PplGenericResult<T>> {
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) return { ok: false, reason: "ppl_api_not_configured" };
  const token = await requestToken(baseUrl);
  if (!token) return { ok: false, reason: "ppl_api_token_failed" };
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
    },
  });
  const text = await res.text().catch(() => "");
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!res.ok) return { ok: false, reason: `ppl_api_http_${res.status}`, raw: parsed };
  return { ok: true, data: parsed as T };
}

export async function pplDebugGet(
  path: string,
  query: Record<string, string | number | Array<string | number>> = {}
): Promise<PplDebugRequestResult> {
  const started = Date.now();
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) {
    return {
      ok: false,
      method: "GET",
      url: path,
      query,
      status: null,
      headers: {},
      data: null,
      error: "ppl_api_not_configured",
      durationMs: Date.now() - started,
      correlationId: null,
    };
  }
  const token = await requestToken(baseUrl);
  if (!token) {
    return {
      ok: false,
      method: "GET",
      url: path,
      query,
      status: null,
      headers: {},
      data: null,
      error: "ppl_api_token_failed",
      durationMs: Date.now() - started,
      correlationId: null,
    };
  }
  const urlObj = new URL(`${normalizeBaseUrl(baseUrl)}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (Array.isArray(v)) {
      for (const item of v) urlObj.searchParams.append(k, String(item));
    } else {
      urlObj.searchParams.set(k, String(v));
    }
  }
  try {
    const res = await fetch(urlObj.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
      },
    });
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    let parsed: unknown = {};
    if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream")) {
      parsed = {
        binary: true,
        contentType: res.headers.get("content-type") || "",
        contentLength: res.headers.get("content-length") || "",
      };
      // Consume body without storing full binary payload.
      await res.arrayBuffer().catch(() => null);
    } else {
      const text = await res.text().catch(() => "");
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
    }
    return {
      ok: res.ok,
      method: "GET",
      url: `${urlObj.origin}${urlObj.pathname}`,
      query,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      data: parsed,
      error: res.ok ? null : `ppl_api_http_${res.status}`,
      durationMs: Date.now() - started,
      correlationId: res.headers.get("x-correlation-id"),
    };
  } catch (err) {
    return {
      ok: false,
      method: "GET",
      url: `${urlObj.origin}${urlObj.pathname}`,
      query,
      status: null,
      headers: {},
      data: null,
      error: String(err),
      durationMs: Date.now() - started,
      correlationId: null,
    };
  }
}

export async function createPplShipment(order: Order, market: Market): Promise<PplResult> {
  if (!isEnabled()) {
    return { ok: false, reason: "ppl_api_disabled" };
  }
  if (order.paymentMethod === "COD" && market === "RO") {
    return { ok: false, reason: "ppl_cod_not_supported_ro" };
  }
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  const createPath = process.env.PPL_API_CREATE_SHIPMENT_PATH?.trim() || "/shipment/batch";
  const pollPath = process.env.PPL_API_POLL_PATH?.trim() || "/shipment/batch";

  if (!baseUrl) {
    return { ok: false, reason: "ppl_api_not_configured" };
  }

  const token = await requestToken(baseUrl);
  if (!token) {
    return { ok: false, reason: "ppl_api_token_failed" };
  }

  const addr = parseAddressLine(order.deliveryAddress);
  const country = market === "HU" ? "HU" : "RO";
  const ref = String(order.orderNumber);
  const productType = productTypeForMarket(market, order.paymentMethod);

  const payload: Record<string, unknown> = {
    returnChannel: {
      type: "Email",
      address: pplLabelReturnEmail(market),
    },
    labelSettings: {
      format: "Pdf",
      dpi: Number(process.env.PPL_LABEL_DPI || 300),
      completeLabelSettings: {
        isCompleteLabelRequested: true,
        pageSize: pplCompleteLabelPageSize(),
        position: Number(process.env.PPL_LABEL_POSITION || 1),
      },
    },
    shipmentsOrderBy: "ShipmentNumber",
    shipments: [
      {
        productType,
        referenceId: ref,
        customerReference: ref,
        note: normalizePplText([order.additionalNotes?.trim(), `Order ${ref}`].filter(Boolean).join(" | "), 250),
        depot: process.env.PPL_DEPOT || undefined,
        recipient: {
          name: normalizePplText(order.customerName, 120),
          contact: normalizePplText(order.customerName, 120),
          street: normalizePplText(addr.street, 120),
          city: normalizePplText(addr.city, 80),
          zipCode: addr.zipCode,
          country,
          phone: order.phone,
          email: order.email,
        },
        services: process.env.PPL_SERVICES
          ? String(process.env.PPL_SERVICES)
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((code) => ({ code }))
          : undefined,
      },
    ],
  };

  const senderName = process.env.PPL_SENDER_NAME?.trim();
  const senderStreet = process.env.PPL_SENDER_STREET?.trim();
  const senderCity = process.env.PPL_SENDER_CITY?.trim();
  const senderZipCode = process.env.PPL_SENDER_ZIP?.trim();
  const senderCountryRaw = process.env.PPL_SENDER_COUNTRY?.trim();
  const senderCountryIso = normalizePplSenderCountryIso2(senderCountryRaw);
  if (senderCountryRaw && !senderCountryIso) {
    return { ok: false, reason: "ppl_sender_country_invalid_use_iso3166_alpha2" };
  }
  const senderCountry = senderCountryIso || "CZ";
  const senderPhone = process.env.PPL_SENDER_PHONE?.trim();
  const senderEmail = process.env.PPL_SENDER_EMAIL?.trim();
  if (senderName && senderStreet && senderCity && senderZipCode && senderPhone && senderEmail) {
    const first = (payload.shipments as Array<Record<string, unknown>>)[0];
    first.sender = {
      name: normalizePplText(senderName, 120),
      contact: normalizePplText(senderName, 120),
      street: normalizePplText(senderStreet, 120),
      city: normalizePplText(senderCity, 80),
      zipCode: senderZipCode,
      country: senderCountry,
      phone: senderPhone,
      email: senderEmail,
    };
  }

  const first = (payload.shipments as Array<Record<string, unknown>>)[0];
  const senderObj = first.sender as Record<string, unknown> | undefined;
  const senderCountryValue = String(senderObj?.country || "");
  if ((market === "RO" || market === "HU") && (!senderObj || !senderCountryValue)) {
    return { ok: false, reason: "ppl_sender_not_configured_for_international" };
  }
  if ((market === "RO" || market === "HU") && senderCountryValue === country) {
    return { ok: false, reason: "ppl_sender_country_must_differ_for_international" };
  }

  if (order.paymentMethod === "COD") {
    const codIban = process.env.PPL_COD_IBAN?.trim();
    const codSwift = process.env.PPL_COD_SWIFT?.trim();
    if (!codIban || !codSwift) {
      return { ok: false, reason: "ppl_cod_bank_data_missing" };
    }
    const settlement = pplCodSettlementAmount(market, order.totalPrice);
    if (!settlement.ok) {
      return { ok: false, reason: settlement.reason };
    }
    const codVarSym = codVarSymFromOrderNumber(order.orderNumber);
    if (!codVarSym || codVarSym.length > 10) {
      return { ok: false, reason: "ppl_cod_varsym_invalid" };
    }
    first.cashOnDelivery = {
      codCurrency: settlement.currency,
      codPrice: settlement.amount,
      codVarSym,
      iban: codIban,
      swift: codSwift,
    };
  }

  try {
    const normalizedBase = normalizeBaseUrl(baseUrl);
    const res = await fetch(`${normalizedBase}${createPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
      },
      body: JSON.stringify(payload),
    });
    const rawText = await res.text().catch(() => "");
    let raw: unknown = {};
    if (rawText) {
      try {
        raw = JSON.parse(rawText) as unknown;
      } catch {
        raw = rawText;
      }
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: `ppl_api_http_${res.status}`,
        raw: {
          body: raw || rawText,
          headers: Object.fromEntries(res.headers.entries()),
        },
      };
    }

    const location = res.headers.get("location") || "";
    const rawRec = toRecord(raw);
    const immediateShipmentNumber = extractShipmentNumberFromAny(rawRec);
    if (immediateShipmentNumber) {
      return {
        ok: true,
        shipmentNumber: immediateShipmentNumber,
        batchId: null,
        referenceId: ref,
        labelPublicPath: null,
        locationHeader: location || null,
        createRequest: payload,
        raw,
      };
    }
    const batchId = extractBatchId(rawRec, location);

    // CPL async mode: poll status endpoint by batch ID.
    if (batchId) {
      const maxPolls = Number(process.env.PPL_API_CREATE_SYNC_POLLS || 0);
      const delayMs = Number(process.env.PPL_API_POLL_DELAY_MS || 900);
      for (let i = 0; i < Math.max(0, maxPolls); i += 1) {
        const pollUrl = location.startsWith("http")
          ? location
          : `${normalizedBase}${pollPath}/${batchId}`;
        const pollRes = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pollRaw = (await pollRes.json().catch(() => ({}))) as Record<string, unknown>;
        const state = String(
          pollRaw.importState || pollRaw.state || pollRaw.status || ""
        ).toUpperCase();
        if (state === "COMPLETE" || state === "COMPLETED" || state === "SUCCESS") {
          const items = Array.isArray(pollRaw.items) ? (pollRaw.items as Array<Record<string, unknown>>) : [];
          const firstItem = items.length > 0 ? toRecord(items[0]) : {};
          const shipmentNumber = String(
            firstItem.shipmentNumber ||
              firstItem.parcelNumber ||
            pollRaw.shipmentId ||
              pollRaw.parcelId ||
              pollRaw.reference ||
              pollRaw.id ||
              batchId
          );
          const labelUrl = firstLabelUrl(pollRaw);
          const savedLabelPath = labelUrl
            ? await downloadAndSaveLabelPdf({
                labelUrl,
                token,
                orderNumber: order.orderNumber,
                market,
                shipmentId: shipmentNumber || batchId,
              }).catch(() => null)
            : null;
          const labelPublicPath = savedLabelPath || labelUrl || null;
          return {
            ok: true,
            shipmentNumber: shipmentNumber || null,
            batchId,
            referenceId: ref,
            labelPublicPath,
            locationHeader: location || null,
            createRequest: payload,
            raw: pollRaw,
          };
        }
        if (state === "ERROR" || state === "FAILED") {
          return { ok: false, reason: "ppl_api_batch_failed", raw: pollRaw };
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      const fallbackNum = extractShipmentNumberFromAny(rawRec);
      return {
        ok: true,
        shipmentNumber: fallbackNum || null,
        batchId: batchId || null,
        referenceId: ref,
        labelPublicPath: null,
        locationHeader: location || null,
        createRequest: payload,
        raw,
      };
    }

    const shipmentNumber = String(
      extractShipmentNumberFromAny(rawRec) ||
      rawRec.shipmentId ||
      rawRec.id ||
      rawRec.parcelId ||
      rawRec.reference ||
      ""
    );
    if (!shipmentNumber && !batchId) {
      return { ok: false, reason: "ppl_api_missing_shipment_id", raw };
    }
    return {
      ok: true,
      shipmentNumber: shipmentNumber || null,
      batchId: batchId || null,
      referenceId: ref,
      labelPublicPath: null,
      locationHeader: location || null,
      createRequest: payload,
      raw,
    };
  } catch (error) {
    return { ok: false, reason: "ppl_api_request_failed", raw: String(error) };
  }
}

export async function fetchPplBatchStatus(
  batchId: string
): Promise<PplGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const hard = await pplDebugGet(`/shipment/batch/${encodeURIComponent(batchId)}`, {});
  if (!hard.ok) {
    return { ok: false, reason: hard.error || `ppl_api_http_${hard.status || 0}`, raw: hard.data };
  }
  const rec = toRecord(hard.data);
  const state = String(rec.state || rec.status || rec.importState || "").toUpperCase();
  const candidate =
    extractShipmentNumberFromAny(rec) || String(rec.shipmentNumber || rec.parcelNumber || "").trim() || "";
  const trackingNumber = /^\d{8,20}$/.test(candidate) ? candidate : null;
  return { ok: true, data: { state, trackingNumber, raw: rec } };
}

export async function fetchPplShipmentInfoByNumber(
  shipmentNumber: string
): Promise<PplGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const number = shipmentNumber.trim();
  if (!number) return { ok: false, reason: "missing_shipment_number" };
  const result = await pplGetJson<Array<Record<string, unknown>>>("/shipment", {
    ShipmentNumbers: [number],
    Limit: 50,
    Offset: 0,
  });
  if (!result.ok) return result;
  const first = Array.isArray(result.data) && result.data.length > 0 ? toRecord(result.data[0]) : {};
  const candidate = String(first.shipmentNumber || number || "").trim();
  const trackingNumber = /^\d{8,20}$/.test(candidate) ? candidate : null;
  const state = String(first.shipmentState || first.state || "").toUpperCase();
  return { ok: true, data: { state, trackingNumber, raw: first } };
}

export async function fetchPplShipmentInfoByCustomerReference(
  customerReference: string
): Promise<PplGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const ref = customerReference.trim();
  if (!ref) return { ok: false, reason: "missing_customer_reference" };
  const result = await pplGetJson<Array<Record<string, unknown>>>("/shipment", {
    CustomerReferences: [ref],
    Limit: 50,
    Offset: 0,
  });
  if (!result.ok) return result;
  const first = Array.isArray(result.data) && result.data.length > 0 ? toRecord(result.data[0]) : {};
  const candidate = String(first.shipmentNumber || first.parcelNumber || "").trim();
  const trackingNumber = /^\d{8,20}$/.test(candidate) ? candidate : null;
  const state = String(first.shipmentState || first.state || "").toUpperCase();
  return { ok: true, data: { state, trackingNumber, raw: first } };
}

export async function fetchPplShipmentByFilters(params: {
  customerReference?: string | null;
  variableSymbol?: string | null;
  dateFromIso?: string | null;
  dateToIso?: string | null;
}): Promise<PplGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const query: Record<string, string | number | Array<string | number>> = {
    Limit: 50,
    Offset: 0,
  };
  const customerReference = String(params.customerReference || "").trim();
  const variableSymbol = String(params.variableSymbol || "").trim();
  if (customerReference) query.CustomerReferences = [customerReference];
  if (variableSymbol) query.VariableSymbols = [variableSymbol];
  if (params.dateFromIso) query.DateFrom = params.dateFromIso;
  if (params.dateToIso) query.DateTo = params.dateToIso;

  const result = await pplGetJson<Array<Record<string, unknown>>>("/shipment", query);
  if (!result.ok) return result;
  const first = Array.isArray(result.data) && result.data.length > 0 ? toRecord(result.data[0]) : {};
  const candidate = String(first.shipmentNumber || first.parcelNumber || "").trim();
  const trackingNumber = /^\d{8,20}$/.test(candidate) ? candidate : null;
  const state = String(first.shipmentState || first.state || "").toUpperCase();
  return { ok: true, data: { state, trackingNumber, raw: first } };
}

export async function cancelPplShipment(shipmentNumber: string): Promise<PplGenericResult<Record<string, unknown>>> {
  const path = process.env.PPL_API_CANCEL_PATH?.trim() || "/shipment/{id}/cancel";
  return pplJsonRequest<Record<string, unknown>>("POST", path, {}, shipmentNumber);
}

export async function createPplPickup(
  market: Market,
  input: {
    pickupDate: string;
    fromTime: string;
    toTime: string;
    contactName: string;
    phone: string;
    email: string;
    shipmentCount: number;
    note?: string;
  }
): Promise<
  PplGenericResult<{
    pickupId: string;
    pickupReference: string;
    pickupCustomerReference: string;
    pickupOrderReference: string | null;
    pickupState: string;
    pickupHttpStatus: number;
    pickupError: string | null;
    raw: unknown;
  }>
> {
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) return { ok: false, reason: "ppl_api_not_configured" };
  const token = await requestToken(baseUrl);
  if (!token) return { ok: false, reason: "ppl_api_token_failed" };

  const senderName = process.env.PPL_SENDER_NAME?.trim();
  const senderStreet = process.env.PPL_SENDER_STREET?.trim();
  const senderCity = process.env.PPL_SENDER_CITY?.trim();
  const senderZipCode = process.env.PPL_SENDER_ZIP?.trim();
  const senderCountry = normalizePplSenderCountryIso2(process.env.PPL_SENDER_COUNTRY?.trim() || "CZ") || "CZ";
  const senderPhone = process.env.PPL_SENDER_PHONE?.trim();
  const senderEmail = process.env.PPL_SENDER_EMAIL?.trim() || pplLabelReturnEmail(market);
  if (!senderName || !senderStreet || !senderCity || !senderZipCode || !senderPhone) {
    return { ok: false, reason: "ppl_pickup_sender_not_configured" };
  }

  const pickupReference = `pickup-${market}-${Date.now()}`.slice(0, 50);
  const pickupCustomerReference = `pickup-customer-${market}-${Date.now()}`.slice(0, 50);
  const payload = {
    orders: [
      {
        orderType: "CollectionOrder",
        referenceId: pickupReference,
        customerReference: pickupCustomerReference,
        shipmentCount: Math.max(1, Math.floor(input.shipmentCount || 1)),
        email: input.email || senderEmail,
        note: String(input.note || "").slice(0, 300) || null,
        sendDate: `${input.pickupDate}T${input.fromTime}:00`,
        pickupTimeFrom: input.fromTime,
        pickupTimeTo: input.toTime,
        sender: {
          name: senderName,
          contact: input.contactName || senderName,
          street: senderStreet,
          city: senderCity,
          zipCode: senderZipCode,
          country: senderCountry,
          phone: input.phone || senderPhone,
          email: input.email || senderEmail,
        },
      },
    ],
  };

  const endpoint = `${normalizeBaseUrl(baseUrl)}${process.env.PPL_API_PICKUP_PATH?.trim() || "/order/batch"}`;
  const createRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
    },
    body: JSON.stringify(payload),
  });
  const createRawText = await createRes.text().catch(() => "");
  let createRaw: unknown = {};
  if (createRawText) {
    try {
      createRaw = JSON.parse(createRawText);
    } catch {
      createRaw = createRawText;
    }
  }
  if (!createRes.ok) return { ok: false, reason: `ppl_api_http_${createRes.status}`, raw: createRaw };
  const location = createRes.headers.get("location") || "";
  const batchId = extractBatchId(toRecord(createRaw), location);
  if (!batchId) return { ok: false, reason: "ppl_pickup_missing_id", raw: createRaw };
  let statusRes: PplGenericResult<Record<string, unknown>> = { ok: false, reason: "ppl_pickup_status_missing" };
  for (let i = 0; i < 4; i += 1) {
    statusRes = await pplJsonRequest<Record<string, unknown>>("GET", "/order/batch/{id}", undefined, batchId);
    if (statusRes.ok) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  const statusRaw = !statusRes.ok ? statusRes.raw : null;
  const statusRawRec = statusRaw && typeof statusRaw === "object" ? toRecord(statusRaw) : {};
  const statusDataRec = statusRes.ok && statusRes.data ? toRecord(statusRes.data) : toRecord(statusRawRec.data);
  const statusOrderRef = String(statusDataRec.orderReference || statusDataRec.referenceId || "").trim() || null;
  const statusState = String(statusDataRec.state || statusDataRec.importState || "").trim() || "ORDERED";
  return {
    ok: true,
    data: {
      pickupId: batchId,
      pickupReference,
      pickupCustomerReference,
      pickupOrderReference: statusOrderRef,
      pickupState: statusState,
      pickupHttpStatus: statusRes.ok ? 200 : 500,
      pickupError: statusRes.ok ? null : String(statusRes.reason || "ppl_pickup_status_error"),
      raw: { create: createRaw, status: statusRes },
    },
  };
}

export async function fetchPplPickupBatchStatus(batchId: string): Promise<PplGenericResult<Record<string, unknown>>> {
  const clean = String(batchId || "").trim();
  if (!clean) return { ok: false, reason: "missing_batch_id" };
  return pplJsonRequest<Record<string, unknown>>("GET", "/order/batch/{id}", undefined, clean);
}

export async function cancelPplPickupByReference(params: {
  customerReference?: string | null;
  orderReference?: string | null;
  note?: string | null;
}): Promise<PplGenericResult<Record<string, unknown>>> {
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) return { ok: false, reason: "ppl_api_not_configured" };
  const token = await requestToken(baseUrl);
  if (!token) return { ok: false, reason: "ppl_api_token_failed" };
  const customerReference = String(params.customerReference || "").trim();
  const orderReference = String(params.orderReference || "").trim();
  if (!customerReference && !orderReference) return { ok: false, reason: "missing_pickup_reference" };
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/order/cancel`);
  if (customerReference) url.searchParams.set("customerReference", customerReference);
  else url.searchParams.set("orderReference", orderReference);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
    },
    body: JSON.stringify({ note: String(params.note || "Cancelled from admin") }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: `ppl_api_http_${res.status}`, raw };
  return { ok: true, data: raw as Record<string, unknown> };
}

export async function fetchPplOrderInfoByCustomerReference(
  customerReference: string
): Promise<PplGenericResult<{ shipmentNumbers: string[]; raw: unknown }>> {
  const ref = customerReference.trim();
  if (!ref) return { ok: false, reason: "missing_customer_reference" };
  const variants: Array<Record<string, string | number | Array<string | number>>> = [
    { OrderReferences: [ref], Limit: 50, Offset: 0 },
    { CustomerReferences: [ref], Limit: 50, Offset: 0 },
    { OrderNumbers: [ref], Limit: 50, Offset: 0 },
  ];
  const raws: unknown[] = [];
  const numbers: string[] = [];
  for (const query of variants) {
    const result = await pplGetJson<Array<Record<string, unknown>>>("/order", query);
    if (!result.ok) {
      raws.push({ query, ok: false, reason: result.reason, raw: result.raw });
      continue;
    }
    const list = Array.isArray(result.data) ? result.data : [];
    raws.push({ query, ok: true, raw: list });
    for (const order of list) {
      const nums = Array.isArray(order.shipmentNumbers) ? order.shipmentNumbers : [];
      for (const n of nums) {
        const s = String(n || "").trim();
        if (/^\d{8,20}$/.test(s)) numbers.push(s);
      }
    }
    if (numbers.length > 0) break;
  }
  return { ok: true, data: { shipmentNumbers: dedupeStrings(numbers), raw: raws } };
}

export async function fetchPplBatchLabelPdf(params: {
  batchId: string;
  completeLabelUrl?: string | null;
}): Promise<PplGenericResult<{ bytes: Buffer; contentType: string; finalUrl: string }>> {
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) return { ok: false, reason: "ppl_api_not_configured" };
  const token = await requestToken(baseUrl);
  if (!token) return { ok: false, reason: "ppl_api_token_failed" };
  const fallbackEndpoint = buildPplBatchLabelFallbackUrl(baseUrl, params.batchId);
  const endpoint =
    resolvePplLabelEndpoint(baseUrl, params.completeLabelUrl || "") || fallbackEndpoint;
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
    },
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    return { ok: false, reason: `ppl_api_http_${res.status}`, raw };
  }
  const arr = await res.arrayBuffer();
  return {
    ok: true,
    data: {
      bytes: Buffer.from(arr),
      contentType: res.headers.get("content-type") || "application/pdf",
      finalUrl: endpoint,
    },
  };
}

export async function fetchPplLabelPdfFromUrl(labelUrl: string): Promise<PplGenericResult<{ bytes: Buffer; contentType: string; finalUrl: string }>> {
  const baseUrl = process.env.PPL_API_BASE_URL?.trim();
  if (!baseUrl) return { ok: false, reason: "ppl_api_not_configured" };
  const token = await requestToken(baseUrl);
  if (!token) return { ok: false, reason: "ppl_api_token_failed" };
  const endpoint = resolvePplLabelEndpoint(baseUrl, labelUrl);
  if (!endpoint) return { ok: false, reason: "ppl_label_url_untrusted" };
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": process.env.PPL_API_ACCEPT_LANGUAGE || "cs-CZ",
    },
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    return { ok: false, reason: `ppl_api_http_${res.status}`, raw };
  }
  const arr = await res.arrayBuffer();
  return {
    ok: true,
    data: {
      bytes: Buffer.from(arr),
      contentType: res.headers.get("content-type") || "application/pdf",
      finalUrl: endpoint,
    },
  };
}
