import { createOrder } from "@/lib/store";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";
import type { Order } from "@/lib/types";
import { NextResponse } from "next/server";

function parsePaymentMethod(raw: unknown): Order["paymentMethod"] {
  const s = String(raw || "");
  if (s === "BANK_TRANSFER") return "BANK_TRANSFER";
  return "COD";
}

function parseShippingCarrier(raw: unknown): ShippingCarrier | null {
  const s = String(raw || "").toUpperCase();
  if ((SHIPPING_CARRIERS as readonly string[]).includes(s)) {
    return s as ShippingCarrier;
  }
  return null;
}

type AddressPayload = {
  street: string;
  city: string;
  postalCode: string;
  county: string;
  country?: string;
};

function toSafe(v: unknown): string {
  return String(v || "").trim();
}

function validateAddress(addr: AddressPayload): string | null {
  if (addr.street.length < 5) return "Strada este prea scurta.";
  if (addr.city.length < 2) return "Orasul este obligatoriu.";
  if (!/^\d{6}$/.test(addr.postalCode)) return "Codul postal trebuie sa aiba 6 cifre.";
  if (addr.county.length < 2) return "Judetul este obligatoriu.";
  return null;
}

function formatAddress(addr: AddressPayload): string {
  return `${addr.street}, ${addr.city}, ${addr.postalCode}, jud. ${addr.county}, Romania`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shippingCarrier = parseShippingCarrier(body.shippingCarrier) ?? "PPL";
    const customerName = toSafe(body.customerName);
    const email = toSafe(body.email);
    const phone = toSafe(body.phone).replace(/\s+/g, "");
    const quantity = Number(body.quantity || 1);
    const delivery: AddressPayload = {
      street: toSafe(body.delivery?.street),
      city: toSafe(body.delivery?.city),
      postalCode: toSafe(body.delivery?.postalCode),
      county: toSafe(body.delivery?.county),
      country: "RO",
    };
    const billingDifferent = Boolean(body.billing?.different);
    const billing: AddressPayload = {
      street: toSafe(body.billing?.street),
      city: toSafe(body.billing?.city),
      postalCode: toSafe(body.billing?.postalCode),
      county: toSafe(body.billing?.county),
      country: "RO",
    };
    const billingCompanyName = toSafe(body.billing?.companyName);
    const billingTaxId = toSafe(body.billing?.taxId);
    const billingTradeRegNo = toSafe(body.billing?.tradeRegNo);

    if (customerName.split(/\s+/).length < 2) {
      return NextResponse.json({ ok: false, message: "Introduceti nume si prenume valide." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, message: "E-mail invalid." }, { status: 400 });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "Telefon invalid." }, { status: 400 });
    }

    const deliveryErr = validateAddress(delivery);
    if (deliveryErr) {
      return NextResponse.json(
        { ok: false, message: `Adresa de livrare este incompleta: ${deliveryErr}` },
        { status: 400 }
      );
    }

    if (billingDifferent) {
      if (!billingCompanyName || !billingTaxId || !billingTradeRegNo) {
        return NextResponse.json(
          { ok: false, message: "Pentru facturare diferita sunt obligatorii Nume entitate, CUI/CIF si Nr. Reg. Com." },
          { status: 400 }
        );
      }
      const billingErr = validateAddress(billing);
      if (billingErr) {
        return NextResponse.json(
          { ok: false, message: `Adresa de facturare este incompleta: ${billingErr}` },
          { status: 400 }
        );
      }
    }

    const deliveryAddress = [
      `Destinatar: ${customerName}`,
      formatAddress(delivery),
    ].join("\n");

    const billingAddress = billingDifferent
      ? [
          `Entitate: ${billingCompanyName}`,
          `CUI/CIF: ${billingTaxId}`,
          `Nr. Reg. Com.: ${billingTradeRegNo}`,
          formatAddress(billing),
        ].join("\n")
      : [
          `Persoana fizica: ${customerName}`,
          formatAddress(delivery),
        ].join("\n");

    const result = await createOrder({
      customerName,
      email,
      phone,
      billingAddress,
      deliveryAddress,
      quantity,
      paymentMethod: parsePaymentMethod(body.paymentMethod),
      shippingCarrier,
      shippingCarrierOther: null,
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
