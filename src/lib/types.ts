export const ORDER_STATUSES = [
  "WAITING_FOR_SHIPPING",
  "ORDERED_PPLRDY",
  "SHIPPED",
  "ORDERED_NOT_PAID",
  "ORDERED_PAID_NOT_SHIPPED",
  "CANCELLED_BY_US",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_QUANTITY",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SHIPPING_CARRIERS = ["PPL", "DPD", "FINESHIP"] as const;
export type ShippingCarrier = (typeof SHIPPING_CARRIERS)[number];

export type PaymentMethod = "COD" | "BANK_TRANSFER" | "CARD_STRIPE";
export type Market = "RO" | "HU";

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
  shippingCarrier: ShippingCarrier;
  /** Rezerva pentru eventuale extinderi viitoare de curier */
  shippingCarrierOther: string | null;
  shippingPrice: number;
  itemPrice: number;
  totalPrice: number;
  status: OrderStatus;
  market?: Market;
  pplShipmentId?: string | null;
  pplBatchId?: string | null;
  pplShipmentStatus?: string | null;
  pplLabelPath?: string | null;
  dpdShipmentId?: string | null;
  dpdShipmentStatus?: string | null;
  dpdLabelPath?: string | null;
  trackingNumber?: string | null;
  additionalNotes?: string | null;
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
