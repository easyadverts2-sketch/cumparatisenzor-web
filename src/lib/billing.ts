import type { Market, Order } from "./types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type InvoiceKind = "PROFORMA" | "FINAL";

export type InvoiceCurrency = "RON" | "HUF" | "EUR";

export type InvoiceData = {
  invoiceNo: string;
  sequenceNo: number;
  variableSymbol: string;
  issueDateIso: string;
  dueDateIso: string;
  currency: InvoiceCurrency;
  market: Market;
  kind: InvoiceKind;
  total: number;
};

export function marketCurrency(market: Market): InvoiceCurrency {
  if (market === "HU") return "HUF";
  if (market === "EU") return "EUR";
  return "RON";
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
      accountName: "Česká maloobchodní s.r.o.",
      iban: "CZ11 0800 0000 0022 1394 5293",
      bic: "GIBACZPX",
    };
  }
  if (market === "EU") {
    return {
      accountName: "Česká maloobchodní s.r.o.",
      iban: process.env.EU_BANK_IBAN || "CZ03 0100 0000 0001 1076 4124",
      bic: process.env.EU_BANK_BIC || "KOMBCZPP",
    };
  }
  return {
    accountName: "Česká maloobchodní s.r.o.",
    iban: "CZ03 0100 0000 0001 1076 4124",
    bic: "KOMBCZPP",
  };
}

function getCompanyDetails() {
  return {
    name: "Česká maloobchodní s.r.o.",
    address: "Braunerova 563/7, Libeň (Praha 8), 180 00 Praha, Česká republika",
    companyIdLabel: "IČO",
    companyId: "23504463",
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

type InvoiceLabelSet = {
  titleProforma: string;
  titleFinal: string;
  orderNumber: string;
  issueDate: string;
  dueDate: string;
  variableSymbol: string;
  client: string;
  phone: string;
  billingAddress: string;
  deliveryAddress: string;
  product: string;
  quantity: string;
  itemsTotal: string;
  shipping: string;
  totalToPay: string;
  paymentDetails: string;
  beneficiary: string;
  reference: string;
  customerAndDelivery: string;
  orderSummary: string;
  company: string;
  address: string;
};

const INVOICE_LABELS_RO: InvoiceLabelSet = {
  titleProforma: "Factura proforma",
  titleFinal: "Factura finala",
  orderNumber: "Numar comanda",
  issueDate: "Data emiterii",
  dueDate: "Data scadentei",
  variableSymbol: "Numar variabil",
  client: "Client",
  phone: "Telefon",
  billingAddress: "Adresa facturare",
  deliveryAddress: "Adresa livrare",
  product: "Produs",
  quantity: "Cantitate",
  itemsTotal: "Total produse",
  shipping: "Transport",
  totalToPay: "Total plata",
  paymentDetails: "Date plata",
  beneficiary: "Beneficiar",
  reference: "Referinta",
  customerAndDelivery: "Date client si livrare",
  orderSummary: "Rezumat comanda",
  company: "Companie",
  address: "Adresa",
};

const INVOICE_LABELS_HU: InvoiceLabelSet = {
  titleProforma: "Dijbekero (proforma)",
  titleFinal: "Vegszamla",
  orderNumber: "Rendelesszam",
  issueDate: "Kiallitas datuma",
  dueDate: "Fizetesi hatarido",
  variableSymbol: "Valtozo szam",
  client: "Vasarlo",
  phone: "Telefon",
  billingAddress: "Szamlazasi cim",
  deliveryAddress: "Szallitasi cim",
  product: "Termek",
  quantity: "Mennyiseg",
  itemsTotal: "Termek osszesen",
  shipping: "Szallitas",
  totalToPay: "Vegosszeg",
  paymentDetails: "Atutalasi adatok",
  beneficiary: "Kedvezmenyezett",
  reference: "Kozlemeny",
  customerAndDelivery: "Vasarlo es szallitasi adatok",
  orderSummary: "Rendeles osszesito",
  company: "Ceg",
  address: "Cim",
};

const INVOICE_LABELS_EU_RU: InvoiceLabelSet = {
  titleProforma: "Счет (проформа)",
  titleFinal: "Окончательный счет",
  orderNumber: "Номер заказа",
  issueDate: "Дата выставления",
  dueDate: "Срок оплаты",
  variableSymbol: "Вариабельный символ",
  client: "Клиент",
  phone: "Телефон",
  billingAddress: "Адрес для счета",
  deliveryAddress: "Адрес доставки",
  product: "Товар",
  quantity: "Количество",
  itemsTotal: "Итого за товар",
  shipping: "Доставка",
  totalToPay: "Сумма к оплате",
  paymentDetails: "Платежные реквизиты",
  beneficiary: "Получатель",
  reference: "Назначение платежа",
  customerAndDelivery: "Данные клиента и доставки",
  orderSummary: "Сводка заказа",
  company: "Компания",
  address: "Адрес",
};

function invoiceLabels(market: Market): InvoiceLabelSet {
  if (market === "HU") return INVOICE_LABELS_HU;
  if (market === "EU") return INVOICE_LABELS_EU_RU;
  return INVOICE_LABELS_RO;
}

/**
 * EU verze (ruština) potřebuje TTF font s podporou azbuky. RO/HU jedou na
 * vestavěné Helvetice. DejaVu Sans (Latin + Greek + Cyrillic) je nesený
 * v repu pod `src/lib/fonts/`.
 */
type EmbeddedFonts = {
  regular: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
};

async function loadFontBytes(fileName: string): Promise<Uint8Array> {
  const filePath = path.join(process.cwd(), "src", "lib", "fonts", fileName);
  const buf = await readFile(filePath);
  return new Uint8Array(buf);
}

async function embedFontsForMarket(doc: PDFDocument, market: Market): Promise<EmbeddedFonts> {
  if (market === "EU") {
    doc.registerFontkit(fontkit);
    const [regularBytes, boldBytes] = await Promise.all([
      loadFontBytes("DejaVuSans.ttf"),
      loadFontBytes("DejaVuSans-Bold.ttf"),
    ]);
    const regular = await doc.embedFont(regularBytes, { subset: true });
    const bold = await doc.embedFont(boldBytes, { subset: true });
    return { regular, bold };
  }
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { regular, bold };
}

function invoiceTitle(labels: InvoiceLabelSet, kind: InvoiceKind): string {
  return kind === "PROFORMA" ? labels.titleProforma : labels.titleFinal;
}

export function renderInvoiceText(order: Order, data: InvoiceData): string {
  const bank = getBankDetails(data.market);
  const issueDate = humanDate(data.issueDateIso);
  const dueDate = humanDate(data.dueDateIso);
  const L = invoiceLabels(data.market);
  const title = invoiceTitle(L, data.kind);
  return [
    `${title}: ${data.invoiceNo}`,
    `${L.orderNumber}: ${String(order.orderNumber)}`,
    `${L.issueDate}: ${issueDate}`,
    `${L.dueDate}: ${dueDate}`,
    `${L.variableSymbol}: ${data.variableSymbol}`,
    `${L.client}: ${order.customerName}`,
    `Email: ${order.email}`,
    `${L.phone}: ${order.phone}`,
    `${L.billingAddress}: ${order.billingAddress.replace(/\n/g, ", ")}`,
    `${L.deliveryAddress}: ${order.deliveryAddress.replace(/\n/g, ", ")}`,
    `${L.product}: FreeStyle Libre 2 Plus`,
    `${L.quantity}: ${order.quantity}`,
    `${L.itemsTotal}: ${order.itemPrice * order.quantity} ${data.currency}`,
    `${L.shipping}: ${order.shippingPrice} ${data.currency}`,
    `${L.totalToPay}: ${data.total} ${data.currency}`,
    "",
    `${L.paymentDetails}:`,
    `${L.beneficiary}: ${bank.accountName}`,
    `IBAN: ${bank.iban}`,
    `BIC/SWIFT: ${bank.bic}`,
    `${L.reference}: ${data.variableSymbol}`,
  ].join("\n");
}

export function renderInvoiceHtml(order: Order, data: InvoiceData): string {
  const L = invoiceLabels(data.market);
  const issueDate = humanDate(data.issueDateIso);
  const dueDate = humanDate(data.dueDateIso);
  const bank = getBankDetails(data.market);
  const title = invoiceTitle(L, data.kind);

  return `
  <div style="font-family:Arial,sans-serif;background:#f8f4f7;padding:20px;color:#0f172a;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #ead5df;border-radius:18px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6f2147,#a22d53,#df5b42);padding:14px 18px;color:#fff;">
        <div style="font-weight:700;font-size:20px;">${title}</div>
        <div style="font-size:13px;opacity:.9;">${data.invoiceNo}</div>
      </div>
      <div style="padding:18px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:7px 0;font-weight:700;">${L.orderNumber}</td><td>${String(order.orderNumber)}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${L.issueDate}</td><td>${issueDate}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${L.dueDate}</td><td>${dueDate}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${L.variableSymbol}</td><td>${data.variableSymbol}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700;">${L.totalToPay}</td><td><strong>${data.total} ${data.currency}</strong></td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #f1e2ea;margin:14px 0;" />
        <p style="margin:6px 0;"><strong>${L.beneficiary}:</strong> ${bank.accountName}</p>
        <p style="margin:6px 0;"><strong>IBAN:</strong> ${bank.iban}</p>
        <p style="margin:6px 0;"><strong>BIC/SWIFT:</strong> ${bank.bic}</p>
        <p style="margin:6px 0;"><strong>${L.reference}:</strong> ${data.variableSymbol}</p>
      </div>
    </div>
  </div>`;
}

export async function renderInvoicePdf(order: Order, data: InvoiceData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 40;
  const { regular: fontRegular, bold: fontBold } = await embedFontsForMarket(doc, data.market);
  const bank = getBankDetails(data.market);
  const company = getCompanyDetails();
  const L = invoiceLabels(data.market);
  const issueDate = humanDate(data.issueDateIso);
  const dueDate = humanDate(data.dueDateIso);
  const title = invoiceTitle(L, data.kind);

  let y = height - margin;
  page.drawRectangle({
    x: margin,
    y: y - 78,
    width: width - margin * 2,
    height: 78,
    color: rgb(0.44, 0.13, 0.28),
  });
  page.drawText(title, {
    x: margin + 18,
    y: y - 30,
    font: fontBold,
    size: 21,
    color: rgb(1, 1, 1),
  });
  page.drawText(data.invoiceNo, {
    x: margin + 18,
    y: y - 54,
    font: fontRegular,
    size: 12,
    color: rgb(1, 1, 1),
  });
  y -= 98;

  const labelSize = 10.5;
  const valueSize = 11.5;
  const lineGap = 17;
  const leftX = margin;
  const rightX = margin + 275;

  const leftRows = [
    [L.orderNumber, String(order.orderNumber)],
    [L.issueDate, issueDate],
    [L.dueDate, dueDate],
    [L.variableSymbol, data.variableSymbol],
  ];
  for (const [label, value] of leftRows) {
    page.drawText(`${label}:`, { x: leftX, y, font: fontBold, size: labelSize, color: rgb(0.35, 0.1, 0.24) });
    page.drawText(value, { x: leftX + 120, y, font: fontRegular, size: valueSize, color: rgb(0.07, 0.1, 0.15) });
    y -= lineGap;
  }

  let yRight = height - margin - 98;
  const rightRows = [
    [L.company, company.name],
    [L.address, company.address],
    [company.companyIdLabel, company.companyId],
  ];
  for (const [label, value] of rightRows) {
    page.drawText(`${label}:`, { x: rightX, y: yRight, font: fontBold, size: labelSize, color: rgb(0.35, 0.1, 0.24) });
    page.drawText(value, { x: rightX + 72, y: yRight, font: fontRegular, size: 10.6, color: rgb(0.07, 0.1, 0.15), maxWidth: width - rightX - 80 });
    yRight -= lineGap;
  }

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.93, 0.84, 0.89),
  });
  y -= 20;

  const sectionTitle = (text: string) => {
    page.drawText(text, {
      x: margin,
      y,
      font: fontBold,
      size: 12,
      color: rgb(0.44, 0.13, 0.28),
    });
    y -= 16;
  };

  const row = (label: string, value: string) => {
    page.drawText(`${label}:`, { x: margin, y, font: fontBold, size: labelSize, color: rgb(0.35, 0.1, 0.24) });
    page.drawText(value, { x: margin + 140, y, font: fontRegular, size: valueSize, color: rgb(0.07, 0.1, 0.15), maxWidth: width - margin - 150 });
    y -= lineGap;
  };

  sectionTitle(L.customerAndDelivery);
  row(L.client, order.customerName);
  row("Email", order.email);
  row(L.phone, order.phone);
  row(L.billingAddress, order.billingAddress.replace(/\n/g, ", "));
  row(L.deliveryAddress, order.deliveryAddress.replace(/\n/g, ", "));

  y -= 6;
  sectionTitle(L.orderSummary);
  row(L.product, "FreeStyle Libre 2 Plus");
  row(L.quantity, String(order.quantity));
  row(L.itemsTotal, `${order.itemPrice * order.quantity} ${data.currency}`);
  row(L.shipping, `${order.shippingPrice} ${data.currency}`);
  row(L.totalToPay, `${data.total} ${data.currency}`);

  y -= 6;
  sectionTitle(L.paymentDetails);
  row(L.beneficiary, bank.accountName);
  row("IBAN", bank.iban);
  row("BIC/SWIFT", bank.bic);
  row(L.variableSymbol, data.variableSymbol);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
