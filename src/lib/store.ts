import { Order, OrderStatus, Store } from "./types";
import { sendEmail } from "./email";
import { getSql } from "./db";

const defaults = {
  inventory: 98,
  sku: "5021791006694",
  price: 350,
  shipping: 10,
};

type Row = Record<string, unknown>;
type SqlClient = ReturnType<typeof getSql>;

function toOrder(row: Row): Order {
  return {
    id: String(row.id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    customerName: String(row.customer_name),
    email: String(row.email),
    phone: String(row.phone),
    billingAddress: String(row.billing_address),
    deliveryAddress: String(row.delivery_address),
    quantity: Number(row.quantity),
    paymentMethod: String(row.payment_method) as Order["paymentMethod"],
    shippingPrice: Number(row.shipping_price),
    itemPrice: Number(row.item_price),
    totalPrice: Number(row.total_price),
    status: String(row.status) as OrderStatus,
  };
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
  paymentMethod: "COD" | "BANK_TRANSFER";
}): Promise<{ ok: boolean; order?: Order; message: string }> {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    const inventory = await getSettingNumber(sql, "inventory", defaults.inventory);
    const price = await getSettingNumber(sql, "price", defaults.price);
    const shipping = await getSettingNumber(sql, "shipping", defaults.shipping);
    const shippingPrice = input.quantity >= 4 ? 0 : shipping;
    const totalPrice = input.quantity * price + shippingPrice;

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

    const order: Order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      billingAddress: input.billingAddress,
      deliveryAddress: input.deliveryAddress,
      quantity: input.quantity,
      paymentMethod: input.paymentMethod,
      shippingPrice,
      itemPrice: price,
      totalPrice,
      status: input.paymentMethod === "BANK_TRANSFER" ? "ORDERED_NOT_PAID" : "WAITING_FOR_SHIPPING",
    };
    await sql`
      insert into orders (
        id, customer_name, email, phone, billing_address, delivery_address,
        quantity, payment_method, shipping_price, item_price, total_price, status
      ) values (
        ${order.id}, ${order.customerName}, ${order.email}, ${order.phone},
        ${order.billingAddress}, ${order.deliveryAddress},
        ${order.quantity}, ${order.paymentMethod}, ${order.shippingPrice},
        ${order.itemPrice}, ${order.totalPrice}, ${order.status}
      )
    `;

    const subject = "Confirmare comanda FreeStyle Libre 2 Plus";
    const body = `Comanda ${order.id} a fost inregistrata. Metoda plata: ${
      input.paymentMethod === "COD" ? "Ramburs" : "Transfer bancar"
    }. ${
      input.paymentMethod === "BANK_TRANSFER"
        ? "Plata trebuie confirmata in maximum 5 zile."
        : "Comanda va fi procesata pentru expediere."
    }`;
    await sql`
      insert into notifications (id, type, recipient, subject, body)
      values (${crypto.randomUUID()}, 'ORDER_CONFIRMATION', ${input.email}, ${subject}, ${body})
    `;
    await sendEmail({ to: input.email, subject, text: body }).catch(() => undefined);
    return { ok: true, order, message: "Comanda a fost inregistrata." };
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
    where payment_method = 'BANK_TRANSFER'
      and status = 'ORDERED_NOT_PAID'
      and created_at < now() - interval '5 days'
  `;
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

    if (
      status === "ORDERED_PAID_NOT_SHIPPED" &&
      order.paymentMethod === "BANK_TRANSFER" &&
      order.status === "ORDERED_NOT_PAID"
    ) {
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
