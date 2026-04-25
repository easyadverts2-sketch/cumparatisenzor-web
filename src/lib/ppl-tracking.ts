export type TrackingCandidate = {
  source: string;
  path: string;
  value: string;
  reason: string;
};

export function normalizeString(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeZip(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, "").trim();
}

export function isUuid(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value ?? "").trim());
}

export function isLikelyPplTrackingNumber(input: unknown): boolean {
  const value = String(input ?? "").replace(/\s+/g, "");
  if (!/^[0-9]{10,14}$/.test(value)) return false;
  if (isUuid(value)) return false;
  return true;
}

export function validatePplShipmentBelongsToOrder(
  order: {
    orderNumber: number;
    pplOrderReference?: string | null;
    customerName: string;
    deliveryAddress: string;
    totalPrice: number;
  },
  shipment: Record<string, unknown>,
  source: "batch" | "shipment_lookup" | "known_tracking_debug",
  codVarSym?: string
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (source === "known_tracking_debug") {
    return { ok: false, reasons: ["known tracking debug source is non-authoritative"] };
  }
  if (source === "batch") {
    const ref = String(shipment.referenceId || "").trim();
    const expectedRef = String(order.pplOrderReference || order.orderNumber);
    if (ref !== String(order.orderNumber) && ref !== expectedRef) {
      reasons.push(`referenceId mismatch (${ref})`);
      return { ok: false, reasons };
    }
    return { ok: true, reasons };
  }

  const paymentInfo =
    shipment.paymentInfo && typeof shipment.paymentInfo === "object"
      ? (shipment.paymentInfo as Record<string, unknown>)
      : {};
  const recipient =
    shipment.recipient && typeof shipment.recipient === "object"
      ? (shipment.recipient as Record<string, unknown>)
      : {};
  const shipmentVarSym = String(paymentInfo.codVariableSymbol || "").trim();
  if (codVarSym && shipmentVarSym && shipmentVarSym !== codVarSym) {
    reasons.push(`codVariableSymbol mismatch (${shipmentVarSym} vs ${codVarSym})`);
  }
  const orderZip = normalizeZip(order.deliveryAddress.match(/\b\d{4,6}\b/)?.[0] || "");
  const shipmentZip = normalizeZip(recipient.zipCode || "");
  if (orderZip && shipmentZip && orderZip !== shipmentZip) {
    reasons.push(`zip mismatch (${shipmentZip} vs ${orderZip})`);
  }
  const orderName = normalizeString(order.customerName);
  const shipmentName = normalizeString(recipient.name || "");
  if (orderName && shipmentName && shipmentName !== orderName) {
    reasons.push(`recipient mismatch (${shipmentName} vs ${orderName})`);
  }
  const shipmentCodPrice = Number(paymentInfo.codPrice ?? NaN);
  if (Number.isFinite(shipmentCodPrice) && Math.round(shipmentCodPrice) !== Math.round(order.totalPrice)) {
    reasons.push(`codPrice mismatch (${shipmentCodPrice} vs ${order.totalPrice})`);
  }
  return { ok: reasons.length === 0, reasons };
}

export function resolveTrackingFromBatch(
  existingTracking: string | null,
  orderRef: string,
  batchResponse: Record<string, unknown>
): string | null {
  const items = Array.isArray(batchResponse.items) ? batchResponse.items : [];
  const selected =
    items.find((it) => {
      const rec = it as Record<string, unknown>;
      return String(rec.referenceId || "").trim() === orderRef;
    }) || (items.length === 1 ? items[0] : null);
  if (!selected || typeof selected !== "object") return existingTracking;
  const rec = selected as Record<string, unknown>;
  const state = String(rec.importState || "").trim().toLowerCase();
  const shipmentNumber = String(rec.shipmentNumber || "").trim();
  if (state === "complete" && isLikelyPplTrackingNumber(shipmentNumber) && !isUuid(shipmentNumber)) {
    return shipmentNumber;
  }
  return existingTracking;
}

