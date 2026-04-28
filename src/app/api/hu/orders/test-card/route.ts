import { createOrder } from "@/lib/store";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";
import { NextResponse } from "next/server";

function toSafe(v: unknown): string {
  return String(v || "").trim();
}

function parseShippingCarrier(raw: unknown): ShippingCarrier | null {
  const s = String(raw || "").toUpperCase();
  if (s === "PACKETA") return "DPD";
  if ((SHIPPING_CARRIERS as readonly string[]).includes(s)) return s as ShippingCarrier;
  return null;
}

export async function POST(request: Request) {
  const testCardEnabled = (process.env.ENABLE_PUBLIC_TEST_CARD || "true").toLowerCase() !== "false";
  if (process.env.NODE_ENV === "production" && !testCardEnabled) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const shippingCarrier = parseShippingCarrier(body.shippingCarrier);
    if (!shippingCarrier) {
      return NextResponse.json({ ok: false, message: "Ervenytelen szallitasi mod." }, { status: 400 });
    }

    const customerName = toSafe(body.customerName);
    const email = toSafe(body.email);
    const phone = toSafe(body.phone).replace(/\s+/g, "");
    const street = toSafe(body.delivery?.street);
    const city = toSafe(body.delivery?.city);
    const postalCode = toSafe(body.delivery?.postalCode);
    if (customerName.split(/\s+/).length < 2) {
      return NextResponse.json({ ok: false, message: "Add meg a teljes nevet." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, message: "Ervenytelen e-mail cim." }, { status: 400 });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "Ervenytelen telefonszam." }, { status: 400 });
    }
    if (!street || !city || !postalCode) {
      return NextResponse.json({ ok: false, message: "Kerlek toltsd ki helyesen a szallitasi cimet." }, { status: 400 });
    }

    const deliveryAddress = [`Cimzett: ${customerName}`, `${street}, ${city}, ${postalCode}, Magyarorszag`].join("\n");
    const billingAddress = [`Maganszemely: ${customerName}`, `${street}, ${city}, ${postalCode}, Magyarorszag`].join("\n");

    const result = await createOrder(
      {
        customerName,
        email,
        phone,
        billingAddress,
        deliveryAddress,
        quantity: 1,
        paymentMethod: "CARD_STRIPE",
        shippingCarrier,
        shippingCarrierOther: null,
        additionalNotes: "TEST_PRODUCT_CARD_HU",
      },
      "HU",
      { fixedItemPrice: 15, fixedShippingPrice: 485 }
    );

    if (result.ok && result.order) {
      return NextResponse.json({
        ok: true,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        paymentMethod: result.order.paymentMethod,
      });
    }
    return NextResponse.json(result, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Szerverhiba." }, { status: 500 });
  }
}
