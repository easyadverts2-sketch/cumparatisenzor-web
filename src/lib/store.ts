import { promises as fs } from "fs";
import path from "path";
import { Order, OrderStatus, Store } from "./types";

const storeFile = path.join(process.cwd(), "data", "store.json");

const defaultStore: Store = {
  inventory: 98,
  sku: "5021791006694",
  price: 350,
  shipping: 10,
  orders: [],
  notifications: [],
};

async function ensureStore() {
  await fs.mkdir(path.dirname(storeFile), { recursive: true });
  try {
    await fs.access(storeFile);
  } catch {
    await fs.writeFile(storeFile, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<Store> {
  await ensureStore();
  const data = await fs.readFile(storeFile, "utf8");
  return JSON.parse(data) as Store;
}

export async function writeStore(store: Store): Promise<void> {
  await fs.writeFile(storeFile, JSON.stringify(store, null, 2), "utf8");
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
  const store = await readStore();
  const shippingPrice = input.quantity >= 4 ? 0 : store.shipping;
  const totalPrice = input.quantity * store.price + shippingPrice;

  if (input.quantity > store.inventory) {
    store.notifications.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: "OUT_OF_STOCK",
      to: input.email,
      subject: "Stoc indisponibil momentan",
      body: "Momentan nu avem stoc suficient. Va vom contacta imediat ce produsul este disponibil din nou.",
    });
    await writeStore(store);
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
    itemPrice: store.price,
    totalPrice,
    status: input.paymentMethod === "BANK_TRANSFER" ? "ORDERED_NOT_PAID" : "WAITING_FOR_SHIPPING",
  };

  store.orders.unshift(order);

  store.notifications.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    type: "ORDER_CONFIRMATION",
    to: input.email,
    subject: "Confirmare comanda FreeStyle Libre 2 Plus",
    body: `Comanda ${order.id} a fost inregistrata. Metoda plata: ${input.paymentMethod === "COD" ? "Ramburs" : "Transfer bancar"}.`,
  });

  await writeStore(store);
  return { ok: true, order, message: "Comanda a fost inregistrata." };
}

export async function autoCancelExpiredOrders() {
  const store = await readStore();
  const now = Date.now();
  let changed = false;

  store.orders = store.orders.map((order) => {
    if (order.paymentMethod === "BANK_TRANSFER" && order.status === "ORDERED_NOT_PAID") {
      const ageDays = (now - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays >= 5) {
        changed = true;
        return { ...order, status: "CANCELLED_BY_US" };
      }
    }
    return order;
  });

  if (changed) {
    await writeStore(store);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const store = await readStore();
  const idx = store.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    return false;
  }

  const order = store.orders[idx];
  if (
    status === "ORDERED_PAID_NOT_SHIPPED" &&
    order.paymentMethod === "BANK_TRANSFER" &&
    order.status === "ORDERED_NOT_PAID"
  ) {
    if (store.inventory < order.quantity) {
      store.orders[idx] = { ...order, status: "CANCELLED_QUANTITY" };
      await writeStore(store);
      return true;
    }
    store.inventory -= order.quantity;
  }
  if (status === "SHIPPED" && order.paymentMethod === "COD" && order.status === "WAITING_FOR_SHIPPING") {
    if (store.inventory < order.quantity) {
      store.orders[idx] = { ...order, status: "CANCELLED_QUANTITY" };
      await writeStore(store);
      return true;
    }
    store.inventory -= order.quantity;
  }

  store.orders[idx] = { ...order, status };
  await writeStore(store);
  return true;
}
