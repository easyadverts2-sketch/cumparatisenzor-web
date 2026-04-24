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
  return `${dd}${mm}${yyyy}${sequenceNo}`;
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

function normalizeIsoDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value;
}

function humanDate(value: string) {
  const d = normalizeIsoDate(value);
  const [yyyy, mm, dd] = d.split("-");
  if (!yyyy || !mm || !dd) return d;
  return `${dd}.${mm}.${yyyy}`;
}

export function renderInvoiceText(order: Order, data: InvoiceData): string {
  const bank = getBankDetails(data.market);
  const issueDate = humanDate(data.issueDateIso);
  const dueDate = humanDate(data.dueDateIso);
  const isHu = data.market === "HU";
  const title = isHu
    ? data.kind === "PROFORMA"
      ? "Dijbekero (proforma)"
      : "Vegszamla"
    : data.kind === "PROFORMA"
      ? "Factura proforma"
      : "Factura finala";
  return [
    `${title}: ${data.invoiceNo}`,
    `${isHu ? "Rendelesszam" : "Numar comanda"}: ${String(order.orderNumber).padStart(7, "0")}`,
    `${isHu ? "Kiallitas datuma" : "Data emiterii"}: ${issueDate}`,
    `${isHu ? "Fizetesi hatarido" : "Data scadentei"}: ${dueDate}`,
    `${isHu ? "Valtozo szam" : "Numar variabil"}: ${data.variableSymbol}`,
    `${isHu ? "Vasarlo" : "Client"}: ${order.customerName}`,
    `Email: ${order.email}`,
    `${isHu ? "Telefon" : "Telefon"}: ${order.phone}`,
    `${isHu ? "Szamlazasi cim" : "Adresa facturare"}: ${order.billingAddress.replace(/\n/g, ", ")}`,
    `${isHu ? "Szallitasi cim" : "Adresa livrare"}: ${order.deliveryAddress.replace(/\n/g, ", ")}`,
    `${isHu ? "Termek" : "Produs"}: FreeStyle Libre 2 Plus`,
    `${isHu ? "Mennyiseg" : "Cantitate"}: ${order.quantity}`,
    `${isHu ? "Termek osszesen" : "Total produse"}: ${order.itemPrice * order.quantity} ${data.currency}`,
    `${isHu ? "Szallitas" : "Transport"}: ${order.shippingPrice} ${data.currency}`,
    `${isHu ? "Vegosszeg" : "Total plata"}: ${data.total} ${data.currency}`,
    "",
    `${isHu ? "Atutalasi adatok" : "Date plata"}:`,
    `${isHu ? "Kedvezmenyezett" : "Beneficiar"}: ${bank.accountName}`,
    `IBAN: ${bank.iban}`,
    `BIC/SWIFT: ${bank.bic}`,
    `${isHu ? "Kozlemeny" : "Referinta"}: ${data.variableSymbol}`,
  ].join("\n");
}

export function renderInvoiceHtml(order: Order, data: InvoiceData): string {
  const isHu = data.market === "HU";
  const issueDate = humanDate(data.issueDateIso);
  const dueDate = humanDate(data.dueDateIso);
  const bank = getBankDetails(data.market);
  const title = isHu
    ? data.kind === "PROFORMA"
      ? "Dijbekero / proforma"
      : "Vegszamla"
    : data.kind === "PROFORMA"
      ? "Factura proforma"
      : "Factura finala";

  return `
  <div style="font-family:Arial,sans-serif;background:#f8f4f7;padding:20px;color:#0f172a;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #ead5df;border-radius:18px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6f2147,#a22d53,#df5b42);padding:14px 18px;color:#fff;">
        <div style="font-weight:700;font-size:20px;">${title}</div>
        <div style="font-size:13px;opacity:.9;">${data.invoiceNo}</div>
      </div>
      <div style="padding:18px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:7px 0;font-weight:700;">${isHu ? "Rendelesszam" : "Numar comanda"}</td><td>${String(order.orderNumber).padStart(7, "0")}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${isHu ? "Kiallitas" : "Emitere"}</td><td>${issueDate}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${isHu ? "Hatarido" : "Scadenta"}</td><td>${dueDate}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${isHu ? "Valtozo szam" : "Numar variabil"}</td><td>${data.variableSymbol}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${isHu ? "Fizetendo osszeg" : "Suma de plata"}</td><td><strong>${data.total} ${data.currency}</strong></td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #f1e2ea;margin:14px 0;" />
        <p style="margin:6px 0;"><strong>${isHu ? "Kedvezmenyezett" : "Beneficiar"}:</strong> ${bank.accountName}</p>
        <p style="margin:6px 0;"><strong>IBAN:</strong> ${bank.iban}</p>
        <p style="margin:6px 0;"><strong>BIC/SWIFT:</strong> ${bank.bic}</p>
        <p style="margin:6px 0;"><strong>${isHu ? "Kozlemeny" : "Referinta"}:</strong> ${data.variableSymbol}</p>
      </div>
    </div>
  </div>`;
}
