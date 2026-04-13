export const ORDER_STATUSES = [
  "WAITING_FOR_SHIPPING",
  "SHIPPED",
  "ORDERED_NOT_PAID",
  "ORDERED_PAID_NOT_SHIPPED",
  "CANCELLED_BY_US",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_QUANTITY",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentMethod = "COD" | "BANK_TRANSFER";

export type Order = {
  id: string;
  /** Numar afisat clientului, ex. 0000001 */
  orderNumber: number;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  billingAddress: string;
  deliveryAddress: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  shippingPrice: number;
  itemPrice: number;
  totalPrice: number;
  status: OrderStatus;
};

export type Notification = {
  id: string;
  createdAt: string;
  type: "ORDER_CONFIRMATION" | "OUT_OF_STOCK";
  to: string;
  subject: string;
  body: string;
};

export type Store = {
  inventory: number;
  sku: string;
  price: number;
  shipping: number;
  orders: Order[];
  notifications: Notification[];
};
