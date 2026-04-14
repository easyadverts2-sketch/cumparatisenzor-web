import { createOrder } from "@/lib/store";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";
import type { Order } from "@/lib/types";
import { NextResponse } from "next/server";

function parsePaymentMethod(raw: unknown): Order["paymentMethod"] {
  const s = String(raw || "");
  if (s === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (s === "CARD_STRIPE") return "CARD_STRIPE";
  return "COD";
}

function parseShippingCarrier(raw: unknown): ShippingCarrier | null {
  const s = String(raw || "").toUpperCase();
  if ((SHIPPING_CARRIERS as readonly string[]).includes(s)) {
    return s as ShippingCarrier;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shippingCarrier = parseShippingCarrier(body.shippingCarrier) ?? "PPL";
    const otherRaw = String(body.shippingCarrierOther || "").trim();
    if (shippingCarrier === "OTHER" && !otherRaw) {
      return NextResponse.json(
        { ok: false, message: "Completati numele curierului pentru optiunea „Alt curier”." },
        { status: 400 }
      );
    }

    const result = await createOrder({
      customerName: String(body.customerName || ""),
      email: String(body.email || ""),
      phone: String(body.phone || ""),
      billingAddress: String(body.billingAddress || ""),
      deliveryAddress: String(body.deliveryAddress || ""),
      quantity: Number(body.quantity || 1),
      paymentMethod: parsePaymentMethod(body.paymentMethod),
      shippingCarrier,
      shippingCarrierOther: shippingCarrier === "OTHER" ? otherRaw : null,
    });

    if (result.ok && result.order) {
      return NextResponse.json(
        {
          ok: true,
          message: result.message,
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          paymentMethod: result.order.paymentMethod,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Eroare server. Va rugam sa incercati din nou." },
      { status: 500 }
    );
  }
}
