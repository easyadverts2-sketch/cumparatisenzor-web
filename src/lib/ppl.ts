import type { Market, Order } from "./types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type PplResult =
  | { ok: true; shipmentId: string; labelPublicPath?: string | null; raw?: unknown }
  | { ok: false; reason: string; raw?: unknown };

function isEnabled() {
  return process.env.PPL_API_ENABLED === "true";
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
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
  const fileName = `${params.market.toLowerCase()}-${String(params.orderNumber).padStart(7, "0")}-${params.shipmentId}.pdf`;
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

export async function createPplShipment(order: Order, market: Market): Promise<PplResult> {
  if (!isEnabled()) {
    return { ok: false, reason: "ppl_api_disabled" };
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

  const payload = {
    reference: String(order.orderNumber).padStart(7, "0"),
    market,
    recipientName: order.customerName,
    recipientEmail: order.email,
    recipientPhone: order.phone,
    deliveryAddress: order.deliveryAddress,
    codAmount: order.paymentMethod === "COD" ? order.totalPrice : 0,
    currency: market === "HU" ? "HUF" : "RON",
    parcels: [
      {
        weightKg: 0.5,
        count: 1,
      },
    ],
  };

  try {
    const normalizedBase = normalizeBaseUrl(baseUrl);
    const res = await fetch(`${normalizedBase}${createPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, reason: `ppl_api_http_${res.status}`, raw };
    }

    const location = res.headers.get("location") || "";
    const batchId = String((raw && (raw.batchId || raw.id)) || location.split("/").pop() || "");

    // CPL async mode: poll status endpoint by batch ID.
    if (batchId) {
      const maxPolls = Number(process.env.PPL_API_MAX_POLLS || 12);
      const delayMs = Number(process.env.PPL_API_POLL_DELAY_MS || 1500);
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
          const shipmentId = String(
            pollRaw.shipmentId ||
              pollRaw.parcelId ||
              pollRaw.reference ||
              pollRaw.id ||
              batchId
          );
          const labelUrl = firstLabelUrl(pollRaw);
          const labelPublicPath = labelUrl
            ? await downloadAndSaveLabelPdf({
                labelUrl,
                token,
                orderNumber: order.orderNumber,
                market,
                shipmentId,
              }).catch(() => null)
            : null;
          return { ok: true, shipmentId, labelPublicPath, raw: pollRaw };
        }
        if (state === "ERROR" || state === "FAILED") {
          return { ok: false, reason: "ppl_api_batch_failed", raw: pollRaw };
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return { ok: true, shipmentId: batchId, labelPublicPath: null, raw };
    }

    const shipmentId = String(raw.shipmentId || raw.id || raw.parcelId || raw.reference || "");
    if (!shipmentId) {
      return { ok: false, reason: "ppl_api_missing_shipment_id", raw };
    }
    return { ok: true, shipmentId, labelPublicPath: null, raw };
  } catch (error) {
    return { ok: false, reason: "ppl_api_request_failed", raw: String(error) };
  }
}
