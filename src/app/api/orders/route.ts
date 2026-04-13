import { createOrder } from "@/lib/store";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";
import type { Order } from "@/lib/types";
import { NextResponse } from "next/server";

function resolveAppBaseUrl(request: Request): string | undefined {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) {
    return env.replace(/\/$/, "");
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}`;
  }
  return undefined;
}

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
      appBaseUrl: resolveAppBaseUrl(request),
    });

    if (result.ok && result.order) {
      return NextResponse.json(
        {
          ok: true,
          message: result.message,
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          paymentMethod: result.order.paymentMethod,
          checkoutUrl: result.checkoutUrl,
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
