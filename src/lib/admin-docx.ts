import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { Market, Order } from "./types";

function rowCell(text: string, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
  });
}

function normalize(text: string | null | undefined): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export async function buildOrdersDocxBuffer(
  orders: Order[],
  market: Market,
  currency: "RON" | "HUF"
): Promise<Buffer> {
  const rows: TableRow[] = [
    new TableRow({
      children: [
        rowCell("Order #", true),
        rowCell("Date", true),
        rowCell("Customer", true),
        rowCell("Email", true),
        rowCell("Phone", true),
        rowCell("Payment", true),
        rowCell("Carrier", true),
        rowCell("Status", true),
        rowCell(`Total ${currency}`, true),
        rowCell("Delivery address", true),
        rowCell("Notes", true),
      ],
    }),
  ];

  for (const o of orders) {
    rows.push(
      new TableRow({
        children: [
          rowCell(String(o.orderNumber)),
          rowCell(new Date(o.createdAt).toLocaleString(market === "HU" ? "hu-HU" : "ro-RO")),
          rowCell(normalize(o.customerName)),
          rowCell(normalize(o.email)),
          rowCell(normalize(o.phone)),
          rowCell(normalize(o.paymentMethod)),
          rowCell(normalize(o.shippingCarrier)),
          rowCell(normalize(o.status)),
          rowCell(String(o.totalPrice)),
          rowCell(normalize((o.deliveryAddress || "").replace(/\n/g, ", "))),
          rowCell(normalize((o.additionalNotes || "").replace(/\n/g, ", "))),
        ],
      })
    );
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Orders export (${market})`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun(`Generated at ${new Date().toISOString()}`)],
          }),
          table,
        ],
      },
    ],
  });

  const uint8 = await Packer.toBuffer(doc);
  return Buffer.from(uint8);
}
