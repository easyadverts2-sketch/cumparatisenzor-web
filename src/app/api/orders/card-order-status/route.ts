import { getCardPaymentIntentOrderNumber } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const pi = new URL(request.url).searchParams.get("pi") || "";
    if (!pi.startsWith("pi_")) {
      return NextResponse.json({ ok: false, message: "Parametru pi invalid." }, { status: 400 });
    }
    const row = await getCardPaymentIntentOrderNumber(pi);
    if (!row.ok) {
      return NextResponse.json({ ok: false, ready: false }, { status: 200 });
    }
    return NextResponse.json({
      ok: true,
      ready: true,
      orderNumber: row.orderNumber,
      market: row.market,
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Eroare server." }, { status: 500 });
  }
}
