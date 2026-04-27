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
  try {
    const body = await request.json();
    const shippingCarrier = parseShippingCarrier(body.shippingCarrier);
    if (!shippingCarrier) {
      return NextResponse.json({ ok: false, message: "Transportator invalid." }, { status: 400 });
    }

    const customerName = toSafe(body.customerName);
    const email = toSafe(body.email);
    const phone = toSafe(body.phone).replace(/\s+/g, "");
    const street = toSafe(body.delivery?.street);
    const city = toSafe(body.delivery?.city);
    const postalCode = toSafe(body.delivery?.postalCode);
    if (customerName.split(/\s+/).length < 2) {
      return NextResponse.json({ ok: false, message: "Introduceti nume si prenume valide." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, message: "E-mail invalid." }, { status: 400 });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "Telefon invalid." }, { status: 400 });
    }
    if (street.length < 5 || city.length < 2 || !/^\d{6}$/.test(postalCode)) {
      return NextResponse.json({ ok: false, message: "Completati corect adresa de livrare." }, { status: 400 });
    }

    const deliveryAddress = [`Destinatar: ${customerName}`, `${street}, ${city}, ${postalCode}, Romania`].join("\n");
    const billingAddress = [`Persoana fizica: ${customerName}`, `${street}, ${city}, ${postalCode}, Romania`].join("\n");

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
        additionalNotes: "TEST_PRODUCT_CARD_RO",
      },
      "RO",
      { fixedItemPrice: 1, fixedShippingPrice: 0 }
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
    return NextResponse.json({ ok: false, message: "Eroare server." }, { status: 500 });
  }
}
