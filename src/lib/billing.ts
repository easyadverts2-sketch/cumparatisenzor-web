import type { Market, Order } from "./types";

export type InvoiceKind = "PROFORMA" | "FINAL";

export type InvoiceData = {
  invoiceNo: string;
  sequenceNo: number;
  variableSymbol: string;
  issueDateIso: string;
  dueDateIso: string;
  currency: "RON" | "HUF";
  market: Market;
  kind: InvoiceKind;
  total: number;
};

export function marketCurrency(market: Market): "RON" | "HUF" {
  return market === "HU" ? "HUF" : "RON";
}

export function formatVariableSymbol(issueDate: Date, sequenceNo: number): string {
  const dd = String(issueDate.getDate()).padStart(2, "0");
  const mm = String(issueDate.getMonth() + 1).padStart(2, "0");
  const yyyy = String(issueDate.getFullYear());
  return `${dd}.${mm}.${yyyy},${sequenceNo}`;
}

export function formatInvoiceNo(kind: InvoiceKind, issueDate: Date, sequenceNo: number): string {
  const yyyy = String(issueDate.getFullYear());
  const prefix = kind === "PROFORMA" ? "PF" : "FV";
  return `${prefix}-${yyyy}-${String(sequenceNo).padStart(6, "0")}`;
}

export function getBankDetails(market: Market) {
  if (market === "HU") {
    return {
      accountName: "Ceska maloobchodni s.r.o.",
      iban: "CZ11 0800 0000 0022 1394 5293",
      bic: "GIBACZPX",
    };
  }
  return {
    accountName: "Ceska Maloobchodni s.r.o.",
    iban: "CZ03 0100 0000 0001 1076 4124",
    bic: "KOMBCZPP",
  };
}

export function renderInvoiceText(order: Order, data: InvoiceData): string {
  const bank = getBankDetails(data.market);
  const title = data.kind === "PROFORMA" ? "Proforma invoice" : "Final invoice";
  return [
    `${title}: ${data.invoiceNo}`,
    `Order: ${String(order.orderNumber).padStart(7, "0")}`,
    `Issue date: ${data.issueDateIso}`,
    `Due date: ${data.dueDateIso}`,
    `Variable symbol: ${data.variableSymbol}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.email}`,
    `Phone: ${order.phone}`,
    `Billing address: ${order.billingAddress.replace(/\n/g, ", ")}`,
    `Delivery address: ${order.deliveryAddress.replace(/\n/g, ", ")}`,
    `Product: FreeStyle Libre 2 Plus`,
    `Quantity: ${order.quantity}`,
    `Item total: ${order.itemPrice * order.quantity} ${data.currency}`,
    `Shipping: ${order.shippingPrice} ${data.currency}`,
    `Total: ${data.total} ${data.currency}`,
    "",
    "Payment details:",
    `Beneficiary: ${bank.accountName}`,
    `IBAN: ${bank.iban}`,
    `BIC/SWIFT: ${bank.bic}`,
    `Reference: ${data.variableSymbol}`,
  ].join("\n");
}
