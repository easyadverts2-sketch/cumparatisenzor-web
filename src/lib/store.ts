import { Market, Order, OrderStatus, ShippingCarrier, Store } from "./types";
import { sendEmail } from "./email";
import { getSql } from "./db";
import { formatOrderNumber } from "./order-format";
import { getStripe } from "./stripe-checkout";
import {
  formatInvoiceNo,
  formatVariableSymbol,
  marketCurrency,
  renderInvoiceHtml,
  renderInvoiceText,
  type InvoiceKind,
} from "./billing";
import { createPplShipment } from "./ppl";
import { createDpdShipment } from "./dpd";
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
    pplShipmentStatus: row.ppl_shipment_status != null ? String(row.ppl_shipment_status) : null,
    pplLabelPath: row.ppl_label_path != null ? String(row.ppl_label_path) : null,
    dpdShipmentId: row.dpd_shipment_id != null ? String(row.dpd_shipment_id) : null,
    dpdShipmentStatus: row.dpd_shipment_status != null ? String(row.dpd_shipment_status) : null,
    dpdLabelPath: row.dpd_label_path != null ? String(row.dpd_label_path) : null,
    trackingNumber: row.tracking_number != null ? String(row.tracking_number) : null,
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
    return;
  }
  await sql`alter table orders add column order_number integer`;
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
      await sql`
        update orders
        set
          ppl_shipment_id = ${ppl.shipmentId},
          ppl_shipment_status = 'CREATED',
          tracking_number = ${ppl.shipmentId},
          ppl_label_path = ${ppl.labelPublicPath || null}
        where id = ${order.id}
      `;
      await insertAuditLog(sql, {
        market,
        action: "PPL_SHIPMENT_CREATED",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: `${auditDetailPrefix || ""} shipment=${ppl.shipmentId} label=${ppl.labelPublicPath || "-"}`.trim(),
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
      await sql`
        update orders
        set
          dpd_shipment_id = ${dpd.shipmentId},
          dpd_shipment_status = 'CREATED',
          tracking_number = ${dpd.shipmentId},
          dpd_label_path = ${dpd.labelPublicPath || null}
        where id = ${order.id}
      `;
      await insertAuditLog(sql, {
        market,
        action: "DPD_SHIPMENT_CREATED",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: `${auditDetailPrefix || ""} shipment=${dpd.shipmentId} label=${dpd.labelPublicPath || "-"}`.trim(),
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
    await sql`
      update orders
      set dpd_shipment_status = ${dpdErr}
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
  const invoiceNo = formatInvoiceNo(kind, issueDate, sequenceNo);
  const variableSymbol = formatVariableSymbol(issueDate, sequenceNo);
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

    const orderId = crypto.randomUUID();
    const status: OrderStatus =
      input.paymentMethod === "BANK_TRANSFER" || input.paymentMethod === "CARD_STRIPE"
        ? "ORDERED_NOT_PAID"
        : "WAITING_FOR_SHIPPING";

    const inserted = await sql`
      insert into orders (
        id, customer_name, email, phone, billing_address, delivery_address,
        quantity, payment_method, shipping_price, item_price, total_price, status,
        shipping_carrier, shipping_carrier_other, market
      ) values (
        ${orderId}, ${input.customerName}, ${input.email}, ${input.phone},
        ${input.billingAddress}, ${input.deliveryAddress},
        ${input.quantity}, ${input.paymentMethod}, ${shippingPrice},
        ${price}, ${totalPrice}, ${status},
        ${input.shippingCarrier}, ${carrierOther}, ${market}
      )
      returning *
    `;
    const order = toOrder(inserted[0] as unknown as Row);
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
          await createShipmentForOrder(sql, order, market, senderFrom, "immediate_cod_shipment");
          const refreshedForMail = await getOrderById(order.id, market);
          if (refreshedForMail) {
            customerMailOrder = refreshedForMail;
          }
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
  const senderFrom = senderEmailForMarket(market);
  await createShipmentForOrder(sql, order, market, senderFrom, "manual_debug_trigger");
  return true;
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
