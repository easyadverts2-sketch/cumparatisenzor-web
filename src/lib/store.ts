import { Order, OrderStatus, ShippingCarrier, Store } from "./types";
import { sendEmail } from "./email";
import { getSql } from "./db";
import { formatOrderNumber } from "./order-format";
import { createStripeCheckoutSession, getStripe } from "./stripe-checkout";

const defaults = {
  inventory: 98,
  sku: "5021791006694",
  price: 350,
  shipping: 10,
};

type Row = Record<string, unknown>;
type SqlClient = ReturnType<typeof getSql>;

function toOrder(row: Row): Order {
  const orderNumber =
    row.order_number !== undefined && row.order_number !== null
      ? Number(row.order_number)
      : 0;
  const carrierRaw = row.shipping_carrier != null ? String(row.shipping_carrier) : "PPL";
  const shippingCarrier = (
    carrierRaw === "PPL" || carrierRaw === "PACKETA" || carrierRaw === "OTHER"
      ? carrierRaw
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
  };
}

export function formatPaymentMethodLabel(pm: Order["paymentMethod"]): string {
  if (pm === "COD") return "Ramburs";
  if (pm === "BANK_TRANSFER") return "Transfer bancar";
  return "Card (online)";
}

export function formatShippingLine(order: Pick<Order, "shippingCarrier" | "shippingCarrierOther">): string {
  if (order.shippingCarrier === "PPL") return "PPL";
  if (order.shippingCarrier === "PACKETA") return "Packeta";
  const o = order.shippingCarrierOther?.trim();
  return o ? `Alt curier: ${o}` : "Alt curier";
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
    insert into app_settings (key, value) values
      ('inventory', ${String(defaults.inventory)}),
      ('sku', ${defaults.sku}),
      ('price', ${String(defaults.price)}),
      ('shipping', ${String(defaults.shipping)})
    on conflict (key) do nothing
  `;

  await migrateOrderNumber(sql);
  await migrateShippingCarrier(sql);
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

export async function readStore(): Promise<Store> {
  const sql = getSql();
  await ensureSchema(sql);
  const [inventory, sku, price, shipping, orderRows, notificationRows] = await Promise.all([
    getSettingNumber(sql, "inventory", defaults.inventory),
    getSettingString(sql, "sku", defaults.sku),
    getSettingNumber(sql, "price", defaults.price),
    getSettingNumber(sql, "shipping", defaults.shipping),
    sql`select * from orders order by created_at desc`,
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

export async function writeStore(store: Store): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
  await sql`insert into app_settings (key, value) values ('inventory', ${String(store.inventory)})
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
  appBaseUrl?: string;
}): Promise<{ ok: boolean; order?: Order; message: string; checkoutUrl?: string }> {
  try {
    const sql = getSql();
    await ensureSchema(sql);

    if (input.paymentMethod === "CARD_STRIPE" && !getStripe()) {
      return {
        ok: false,
        message:
          "Plata cu cardul nu este activata pe server. Alegeti alta metoda sau incercati mai tarziu.",
      };
    }

    const inventory = await getSettingNumber(sql, "inventory", defaults.inventory);
    const price = await getSettingNumber(sql, "price", defaults.price);
    const shipping = await getSettingNumber(sql, "shipping", defaults.shipping);
    const shippingPrice = input.quantity >= 4 ? 0 : shipping;
    const totalPrice = input.quantity * price + shippingPrice;

    const carrierOther =
      input.shippingCarrier === "OTHER"
        ? (input.shippingCarrierOther?.trim() || null)
        : null;

    if (input.quantity > inventory) {
      const subject = "Stoc indisponibil momentan";
      const body =
        "Momentan nu avem stoc suficient. Va vom contacta imediat ce produsul este disponibil din nou.";
      await sql`
        insert into notifications (id, type, recipient, subject, body)
        values (${crypto.randomUUID()}, 'OUT_OF_STOCK', ${input.email}, ${subject}, ${body})
      `;
      await sendEmail({ to: input.email, subject, text: body }).catch(() => undefined);
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
        shipping_carrier, shipping_carrier_other
      ) values (
        ${orderId}, ${input.customerName}, ${input.email}, ${input.phone},
        ${input.billingAddress}, ${input.deliveryAddress},
        ${input.quantity}, ${input.paymentMethod}, ${shippingPrice},
        ${price}, ${totalPrice}, ${status},
        ${input.shippingCarrier}, ${carrierOther}
      )
      returning *
    `;
    const order = toOrder(inserted[0] as unknown as Row);

    const nr = formatOrderNumber(order.orderNumber);
    const subject = "Confirmare comanda FreeStyle Libre 2 Plus";
    const payHint =
      input.paymentMethod === "BANK_TRANSFER"
        ? "Plata trebuie confirmata in maximum 5 zile."
        : input.paymentMethod === "CARD_STRIPE"
          ? "Urmeaza sa fiti redirectionat catre plata securizata cu cardul. Daca inchideti pagina inainte de plata, comanda ramane in asteptare."
          : "Comanda va fi procesata pentru expediere.";
    const body = `Comanda #${nr} a fost inregistrata. Metoda plata: ${formatPaymentMethodLabel(
      input.paymentMethod
    )}. Curier / livrare: ${formatShippingLine(order)}. ${payHint}`;
    await sql`
      insert into notifications (id, type, recipient, subject, body)
      values (${crypto.randomUUID()}, 'ORDER_CONFIRMATION', ${input.email}, ${subject}, ${body})
    `;
    await sendEmail({ to: input.email, subject, text: body }).catch(() => undefined);

    const internal = process.env.INTERNAL_ORDER_EMAIL;
    if (internal) {
      const internalText = [
        `Comanda noua #${nr}`,
        `Client: ${order.customerName}`,
        `Email: ${order.email}`,
        `Telefon: ${order.phone}`,
        `Cantitate: ${order.quantity}`,
        `Livrare: ${formatShippingLine(order)}`,
        `Total: ${order.totalPrice} RON`,
        `Plata: ${formatPaymentMethodLabel(input.paymentMethod)}`,
        `Status: ${order.status}`,
      ].join("\n");
      await sendEmail({
        to: internal,
        subject: `Comanda noua #${nr} - cumparatisenzor.ro`,
        text: internalText,
      }).catch(() => undefined);
    }

    let checkoutUrl: string | undefined;
    if (input.paymentMethod === "CARD_STRIPE") {
      const url = await createStripeCheckoutSession(order, input.appBaseUrl);
      if (!url) {
        return {
          ok: false,
          order,
          message:
            "Comanda a fost inregistrata, dar sesiunea de plata nu s-a putut crea. Va rugam sa ne contactati cu numarul comenzii.",
        };
      }
      checkoutUrl = url;
    }

    return { ok: true, order, message: "Comanda a fost inregistrata.", checkoutUrl };
  } catch {
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

export async function getOrderByNumber(orderNumber: number): Promise<Order | null> {
  const sql = getSql();
  await ensureSchema(sql);
  if (!Number.isFinite(orderNumber) || orderNumber < 1) {
    return null;
  }
  const rows = await sql`select * from orders where order_number = ${orderNumber} limit 1`;
  if (rows.length === 0) {
    return null;
  }
  return toOrder(rows[0] as unknown as Row);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql`select * from orders where id = ${orderId} limit 1`;
  if (rows.length === 0) {
    return null;
  }
  return toOrder(rows[0] as unknown as Row);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = await sql`select * from orders where id = ${orderId} limit 1`;
  if (rows.length === 0) {
    return false;
  }
  const order = toOrder(rows[0] as unknown as Row);

  return sql.begin(async (tx) => {
    const invRows = await tx`select value from app_settings where key = 'inventory' limit 1`;
    const inventory = invRows.length === 0 ? defaults.inventory : Number(invRows[0].value);

    const prepaid =
      order.paymentMethod === "BANK_TRANSFER" || order.paymentMethod === "CARD_STRIPE";
    if (status === "ORDERED_PAID_NOT_SHIPPED" && prepaid && order.status === "ORDERED_NOT_PAID") {
      if (inventory < order.quantity) {
        await tx`update orders set status = 'CANCELLED_QUANTITY' where id = ${orderId}`;
        return true;
      }
      await tx`update app_settings set value = ${String(inventory - order.quantity)} where key = 'inventory'`;
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
      await tx`update app_settings set value = ${String(inventory - order.quantity)} where key = 'inventory'`;
    }

    await tx`update orders set status = ${status} where id = ${orderId}`;
    return true;
  });
}
