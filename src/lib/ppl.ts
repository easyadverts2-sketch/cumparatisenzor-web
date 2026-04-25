import type { Market, Order } from "./types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type PplResult =
  | { ok: true; shipmentId: string; labelPublicPath?: string | null; raw?: unknown }
  | { ok: false; reason: string; raw?: unknown };

type PplGenericResult<T> = { ok: true; data: T } | { ok: false; reason: string; raw?: unknown };

function isEnabled() {
  return process.env.PPL_API_ENABLED === "true";
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
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
        note: [order.additionalNotes?.trim(), `Order ${ref}`].filter(Boolean).join(" | ").slice(0, 250),
        depot: process.env.PPL_DEPOT || undefined,
        recipient: {
          name: order.customerName,
          contact: order.customerName,
          street: addr.street,
          city: addr.city,
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
      name: senderName,
      contact: senderName,
      street: senderStreet,
      city: senderCity,
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
    first.cashOnDelivery = {
      codCurrency: settlement.currency,
      codPrice: settlement.amount,
      codVarSym: ref,
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
      return { ok: true, shipmentId: immediateShipmentNumber, labelPublicPath: null, raw };
    }
    const batchId = extractBatchId(rawRec, location);

    // CPL async mode: poll status endpoint by batch ID.
    if (batchId) {
      const maxPolls = Number(process.env.PPL_API_MAX_POLLS || 10);
      const delayMs = Number(process.env.PPL_API_POLL_DELAY_MS || 900);
      for (let i = 0; i < maxPolls; i += 1) {
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
          const shipmentId = String(
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
                shipmentId,
              }).catch(() => null)
            : null;
          const labelPublicPath = savedLabelPath || labelUrl || null;
          return { ok: true, shipmentId, labelPublicPath, raw: pollRaw };
        }
        if (state === "ERROR" || state === "FAILED") {
          return { ok: false, reason: "ppl_api_batch_failed", raw: pollRaw };
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      const fallbackNum = extractShipmentNumberFromAny(rawRec);
      return { ok: true, shipmentId: fallbackNum || batchId, labelPublicPath: null, raw };
    }

    const shipmentId = String(
      extractShipmentNumberFromAny(rawRec) ||
      rawRec.shipmentId ||
      rawRec.id ||
      rawRec.parcelId ||
      rawRec.reference ||
      ""
    );
    if (!shipmentId) {
      return { ok: false, reason: "ppl_api_missing_shipment_id", raw };
    }
    return { ok: true, shipmentId, labelPublicPath: null, raw };
  } catch (error) {
    return { ok: false, reason: "ppl_api_request_failed", raw: String(error) };
  }
}

export async function fetchPplShipmentStatus(
  shipmentId: string
): Promise<PplGenericResult<{ state: string; trackingNumber: string | null; raw: unknown }>> {
  const path = process.env.PPL_API_TRACK_PATH?.trim() || "/shipment/batch/{id}";
  const res = await pplJsonRequest<Record<string, unknown>>("GET", path, undefined, shipmentId);
  if (!res.ok) return res;
  const rec = toRecord(res.data);
  const state = String(rec.state || rec.status || rec.importState || "").toUpperCase();
  const candidate =
    extractShipmentNumberFromAny(rec) || String(rec.shipmentNumber || rec.parcelNumber || "").trim() || "";
  const trackingNumber = /^\d{11}$/.test(candidate) ? candidate : null;
  return { ok: true, data: { state, trackingNumber, raw: rec } };
}

export async function cancelPplShipment(shipmentId: string): Promise<PplGenericResult<Record<string, unknown>>> {
  const path = process.env.PPL_API_CANCEL_PATH?.trim() || "/shipment/{id}/cancel";
  return pplJsonRequest<Record<string, unknown>>("POST", path, {}, shipmentId);
}

export async function createPplPickup(
  market: Market,
  note: string
): Promise<PplGenericResult<{ pickupId: string; raw: unknown }>> {
  const path = process.env.PPL_API_PICKUP_PATH?.trim() || "/pickup-order";
  const res = await pplJsonRequest<Record<string, unknown>>("POST", path, {
    market,
    note: note.slice(0, 300),
  });
  if (!res.ok) return res;
  const rec = toRecord(res.data);
  const pickupId = String(rec.pickupId || rec.id || rec.orderId || "").trim();
  if (!pickupId) return { ok: false, reason: "ppl_pickup_missing_id", raw: rec };
  return { ok: true, data: { pickupId, raw: rec } };
}
