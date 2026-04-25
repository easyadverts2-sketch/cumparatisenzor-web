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
): { ok: boolean; reasons: string[]; matchedFields: string[]; mismatchedFields: string[] } {
  const reasons: string[] = [];
  const matchedFields: string[] = [];
  const mismatchedFields: string[] = [];
  if (source === "known_tracking_debug") {
    return {
      ok: false,
      reasons: ["known tracking debug source is non-authoritative"],
      matchedFields,
      mismatchedFields: ["source"],
    };
  }
  if (source === "batch") {
    const ref = String(shipment.referenceId || "").trim();
    const expectedRef = String(order.pplOrderReference || order.orderNumber);
    if (ref !== String(order.orderNumber) && ref !== expectedRef) {
      reasons.push(`referenceId mismatch (${ref})`);
      mismatchedFields.push("referenceId");
      return { ok: false, reasons, matchedFields, mismatchedFields };
    }
    matchedFields.push("referenceId");
    return { ok: true, reasons, matchedFields, mismatchedFields };
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
    mismatchedFields.push("codVariableSymbol");
  } else if (codVarSym && shipmentVarSym && shipmentVarSym === codVarSym) {
    matchedFields.push("codVariableSymbol");
  }
  const orderZip = normalizeZip(order.deliveryAddress.match(/\b\d{4,6}\b/)?.[0] || "");
  const shipmentZip = normalizeZip(recipient.zipCode || "");
  if (orderZip && shipmentZip && orderZip !== shipmentZip) {
    reasons.push(`zip mismatch (${shipmentZip} vs ${orderZip})`);
    mismatchedFields.push("recipient.zipCode");
  } else if (orderZip && shipmentZip && orderZip === shipmentZip) {
    matchedFields.push("recipient.zipCode");
  }
  const orderName = normalizeString(order.customerName);
  const shipmentName = normalizeString(recipient.name || "");
  if (orderName && shipmentName && shipmentName !== orderName) {
    reasons.push(`recipient mismatch (${shipmentName} vs ${orderName})`);
    mismatchedFields.push("recipient.name");
  } else if (orderName && shipmentName && shipmentName === orderName) {
    matchedFields.push("recipient.name");
  }
  const shipmentCodPrice = Number(paymentInfo.codPrice ?? NaN);
  if (Number.isFinite(shipmentCodPrice) && Math.round(shipmentCodPrice) !== Math.round(order.totalPrice)) {
    reasons.push(`codPrice mismatch (${shipmentCodPrice} vs ${order.totalPrice})`);
    mismatchedFields.push("paymentInfo.codPrice");
  } else if (Number.isFinite(shipmentCodPrice) && Math.round(shipmentCodPrice) === Math.round(order.totalPrice)) {
    matchedFields.push("paymentInfo.codPrice");
  }
  return { ok: reasons.length === 0, reasons, matchedFields, mismatchedFields };
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

