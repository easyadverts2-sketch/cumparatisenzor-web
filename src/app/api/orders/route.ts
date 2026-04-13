import { createOrder } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
