import { createOrder } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createOrder({
      customerName: String(body.customerName || ""),
      email: String(body.email || ""),
      phone: String(body.phone || ""),
      billingAddress: String(body.billingAddress || ""),
      deliveryAddress: String(body.deliveryAddress || ""),
      quantity: Number(body.quantity || 1),
      paymentMethod: body.paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD",
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
