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
  pplOrderBatchId?: string | null;
  pplOrderNumber?: string | null;
  pplOrderReference?: string | null;
  pplImportState?: string | null;
  pplShipmentState?: string | null;
  pplLastHttpStatus?: number | null;
  pplLastError?: string | null;
  pplRawCreateRequest?: string | null;
  pplRawCreateResponse?: string | null;
  pplLocationHeader?: string | null;
  pplRawBatchStatusResponse?: string | null;
  pplRawLabelResponse?: string | null;
  pplRawOrderResponse?: string | null;
  pplRawShipmentResponse?: string | null;
  pplLabelUrl?: string | null;
  pplCompleteLabelUrl?: string | null;
  pplBulkLabelUrls?: string | null;
  trackingNumberSource?: string | null;
  trackingNumberJsonPath?: string | null;
  pplTrackingUrl?: string | null;
  pplCancelMode?: string | null;
  pplCancelAttempted?: boolean | null;
  pplCancelShipmentNumber?: string | null;
  pplCancelHttpStatus?: number | null;
  pplCancelResponse?: string | null;
  pplLocalResetDone?: boolean | null;
  pplShipmentStatus?: string | null;
  pplLabelPath?: string | null;
  dpdShipmentId?: string | null;
  dpdShipmentStatus?: string | null;
  dpdLastHttpStatus?: number | null;
  dpdLastError?: string | null;
  dpdRawCreateRequest?: string | null;
  dpdRawCreateResponse?: string | null;
  dpdRawStatusResponse?: string | null;
  dpdRawLabelResponse?: string | null;
  dpdRawCancelResponse?: string | null;
  dpdCancelMode?: string | null;
  dpdCancelAttempted?: boolean | null;
  dpdCancelHttpStatus?: number | null;
  dpdCancelResponse?: string | null;
  dpdLocalResetDone?: boolean | null;
  dpdTrackingSource?: string | null;
  dpdTrackingJsonPath?: string | null;
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
