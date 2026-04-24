"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PaymentMethod } from "@/lib/types";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";

type ApiOk = {
  ok: true;
  message?: string;
  orderId: string;
  orderNumber: number;
  paymentMethod: PaymentMethod;
};

function parsePaymentMethod(raw: string): PaymentMethod {
  if (raw === "BANK_TRANSFER") return "BANK_TRANSFER";
  return "COD";
}

function parseShippingCarrier(raw: string): ShippingCarrier {
  const u = raw.toUpperCase();
  if (u === "PACKETA") return "DPD";
  if (u === "PPL" || u === "DPD" || u === "FINESHIP") {
    return u as ShippingCarrier;
  }
  return "PPL";
}

export function OrderFormHu() {
  const PRODUCT_NAME = "FreeStyle Libre 2 Plus";
  const UNIT_PRICE = 25339;
  const STANDARD_SHIPPING = 3199;
  const FINESHIP_SHIPPING = 16000;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carrier, setCarrier] = useState<ShippingCarrier>("PPL");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [quantity, setQuantity] = useState(1);
  const [deliveryFullName, setDeliveryFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryCounty, setDeliveryCounty] = useState("");
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billingCompanyName, setBillingCompanyName] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [billingTradeRegNo, setBillingTradeRegNo] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCounty, setBillingCounty] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeGdpr, setAgreeGdpr] = useState(false);

  const fineshipAllowed = quantity >= 6;

  useEffect(() => {
    if (!fineshipAllowed && carrier === "FINESHIP") {
      setCarrier("PPL");
    }
  }, [carrier, fineshipAllowed]);

  useEffect(() => {
    if (carrier === "DPD" && paymentMethod === "COD") {
      setPaymentMethod("BANK_TRANSFER");
    }
  }, [carrier, paymentMethod]);

  const shippingPrice =
    carrier === "FINESHIP" ? FINESHIP_SHIPPING : quantity >= 5 ? 0 : STANDARD_SHIPPING;
  const productsTotal = quantity * UNIT_PRICE;
  const orderTotal = productsTotal + shippingPrice;
  const postalRegex = /^\d{4}$/;

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const shippingCarrier = parseShippingCarrier(String(formData.get("shippingCarrier") || "PPL"));
      const customerName = String(formData.get("deliveryFullName") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").replace(/\s+/g, "");
      const quantityInput = Math.max(1, Number(formData.get("quantity") || 1));
      const paymentMethodInput = parsePaymentMethod(String(formData.get("paymentMethod") || "COD"));
      const delivery = {
        fullName: customerName,
        street: String(formData.get("deliveryStreet") || "").trim(),
        city: String(formData.get("deliveryCity") || "").trim(),
        postalCode: String(formData.get("deliveryPostalCode") || "").trim(),
        county: String(formData.get("deliveryCounty") || "").trim(),
        country: "HU",
      };
      const billing = {
        different: String(formData.get("billingDifferent") || "") === "on",
        companyName: String(formData.get("billingCompanyName") || "").trim(),
        taxId: String(formData.get("billingTaxId") || "").trim(),
        tradeRegNo: String(formData.get("billingTradeRegNo") || "").trim(),
        street: String(formData.get("billingStreet") || "").trim(),
        city: String(formData.get("billingCity") || "").trim(),
        postalCode: String(formData.get("billingPostalCode") || "").trim(),
        county: String(formData.get("billingCounty") || "").trim(),
        country: "HU",
      };

      if (delivery.fullName.split(/\s+/).length < 2) {
        setError("Kerlek add meg a teljes nevet.");
        setLoading(false);
        return;
      }
      if (!email.includes("@") || email.length < 5) {
        setError("Ervenytelen e-mail cim.");
        setLoading(false);
        return;
      }
      if (!/^\+?[0-9]{9,15}$/.test(phone)) {
        setError("Ervenytelen telefonszam.");
        setLoading(false);
        return;
      }
      if (
        delivery.street.length < 5 ||
        delivery.city.length < 2 ||
        !postalRegex.test(delivery.postalCode) ||
        delivery.county.length < 2
      ) {
        setError("Kerlek toltsd ki helyesen a szallitasi cimet (utca, varos, iranyitoszam, megye).");
        setLoading(false);
        return;
      }
      if (shippingCarrier === "FINESHIP" && quantityInput < 6) {
        setError("A Fineship csak 6 darabtol erheto el.");
        setLoading(false);
        return;
      }
      if (
        billing.different &&
        (!billing.companyName ||
          !billing.taxId ||
          !billing.tradeRegNo ||
          billing.street.length < 5 ||
          billing.city.length < 2 ||
          !postalRegex.test(billing.postalCode) ||
          billing.county.length < 2)
      ) {
        setError("Kerlek toltsd ki a kulon szamlazasi adatokat is.");
        setLoading(false);
        return;
      }
      if (!agreeTerms || !agreeGdpr) {
        setError("A rendelesehez el kell fogadni az ASZF es az adatvedelmi felteteleket.");
        setLoading(false);
        return;
      }

      const payload = {
        customerName: delivery.fullName,
        email,
        phone,
        delivery,
        billing,
        quantity: quantityInput,
        paymentMethod: paymentMethodInput,
        shippingCarrier,
      };

      const res = await fetch("/api/hu/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("invalid_response");
      }

      const data = (await res.json()) as ApiOk | { ok: false; message?: string };
      if (!data.ok || !("orderNumber" in data)) {
        setError(data.message || "Hiba tortent a rendelesnel.");
        return;
      }

      const nr = String(data.orderNumber);

      if (data.paymentMethod === "BANK_TRANSFER") {
        router.push(`/hu/comanda/plata?nr=${encodeURIComponent(nr)}`);
      } else {
        router.push(`/hu/comanda/multumesc?nr=${encodeURIComponent(nr)}`);
      }
    } catch {
      setError("A rendeles kuldese sikertelen. Probald ujra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-5 rounded-2xl border-2 border-[#0d4f4a]/15 bg-white p-6 shadow-sm md:grid-cols-2"
    >
      {error ? (
        <p className="md:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-900">{error}</p>
      ) : null}

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-[#0a2624]">Fizetesi mod</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f0faf8] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4]">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              className="mt-1 accent-[#0d9488]"
              disabled={carrier === "DPD"}
            />
            <span>
              <span className="font-semibold text-[#0a2624]">Utanvet</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                {carrier === "DPD"
                  ? "DPD szallitashoz Magyarorszagon utanvet jelenleg nem elerheto."
                  : "A futarnak fizetsz atvetelkor."}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f0faf8] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4]">
            <input
              type="radio"
              name="paymentMethod"
              value="BANK_TRANSFER"
              checked={paymentMethod === "BANK_TRANSFER"}
              onChange={() => setPaymentMethod("BANK_TRANSFER")}
              className="mt-1 accent-[#0d9488]"
            />
            <span>
              <span className="font-semibold text-[#0a2624]">Banki atutalas</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">A feladast a jovairas utan inditjuk.</span>
            </span>
          </label>
        </div>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-[#0a2624]">Futar / szallitas</h3>
        {carrier === "DPD" ? (
          <p className="mt-1 text-sm text-[#7a3f54]">
            DPD eseteben jelenleg csak banki atutalas valaszthato (utanvet nem).
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SHIPPING_CARRIERS.map((c) => (
            <label
              key={c}
              className={`flex gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f8fbfb] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4] ${
                c === "FINESHIP" && !fineshipAllowed ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="shippingCarrier"
                value={c}
                checked={carrier === c}
                onChange={() => setCarrier(c)}
                disabled={c === "FINESHIP" && !fineshipAllowed}
                className="mt-1 accent-[#0d9488]"
              />
              <span className="min-w-0">
                <span className="block font-semibold text-[#0a2624]">
                  {c === "PPL" ? "PPL" : c === "DPD" ? "DPD" : "Fineship"}
                </span>
                {c === "FINESHIP" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">Premium szallitas, 1-3 nap.</span>
                ) : c === "PPL" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">Standard PPL, 2-4 nap.</span>
                ) : (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">Standard DPD, 2-4 nap.</span>
                )}

                {c === "FINESHIP" ? (
                  <span className="mt-2 inline-flex rounded-full bg-[#f8d9c4] px-2.5 py-1 text-xs font-medium text-[#7a3f54]">
                    Min. 6 db • 16000 HUF
                  </span>
                ) : (
                  <span className="mt-2 inline-flex rounded-full bg-[#e9f7f4] px-2.5 py-1 text-xs font-medium text-[#155e57]">
                    3199 HUF • 5 db-tol ingyenes
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <input
        name="deliveryFullName"
        placeholder="Teljes nev"
        required
        value={deliveryFullName}
        onChange={(e) => setDeliveryFullName(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="phone"
        placeholder="Telefonszam"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="quantity"
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryStreet"
        placeholder="Utca, hazszam"
        required
        value={deliveryStreet}
        onChange={(e) => setDeliveryStreet(e.target.value)}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryCity"
        placeholder="Varos"
        required
        value={deliveryCity}
        onChange={(e) => setDeliveryCity(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryPostalCode"
        placeholder="Iranyitoszam (4 szamjegy)"
        required
        pattern="\d{4}"
        value={deliveryPostalCode}
        onChange={(e) => setDeliveryPostalCode(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryCounty"
        placeholder="Megye"
        required
        value={deliveryCounty}
        onChange={(e) => setDeliveryCounty(e.target.value)}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />

      <div className="md:col-span-2 rounded-2xl border border-[#de6a44]/25 bg-white p-4">
        <label className="flex items-start gap-3 text-sm text-[#3a1d2d]">
          <input
            type="checkbox"
            name="billingDifferent"
            checked={billingDifferent}
            onChange={(e) => setBillingDifferent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#be3f6f]"
          />
          <span>A szamlazasi cim elter a szallitasi cimtől.</span>
        </label>
      </div>

      {billingDifferent ? (
        <>
          <input
            name="billingCompanyName"
            placeholder="Cegnev"
            required
            value={billingCompanyName}
            onChange={(e) => setBillingCompanyName(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTaxId"
            placeholder="Adoszam"
            required
            value={billingTaxId}
            onChange={(e) => setBillingTaxId(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTradeRegNo"
            placeholder="Cegjegyzekszam"
            required
            value={billingTradeRegNo}
            onChange={(e) => setBillingTradeRegNo(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingStreet"
            placeholder="Szamlazasi utca, hazszam"
            required
            value={billingStreet}
            onChange={(e) => setBillingStreet(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingCity"
            placeholder="Szamlazasi varos"
            required
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingPostalCode"
            placeholder="Szamlazasi iranyitoszam"
            required
            pattern="\d{4}"
            value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingCounty"
            placeholder="Szamlazasi megye"
            required
            value={billingCounty}
            onChange={(e) => setBillingCounty(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
        </>
      ) : null}

      <div className="md:col-span-2 rounded-2xl border-2 border-[#de6a44]/25 bg-[#fff4ec] p-5">
        <h4 className="text-base font-semibold text-[#3a1d2d]">Rendeles osszegzes</h4>
        <dl className="mt-3 space-y-2 text-sm text-[#5c3046]">
          <div className="flex items-center justify-between">
            <dt>
              {PRODUCT_NAME} ({quantity} x {UNIT_PRICE} HUF)
            </dt>
            <dd className="font-medium">{productsTotal} HUF</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Szallitas ({carrier === "PPL" ? "PPL" : carrier === "DPD" ? "DPD" : "Fineship"})</dt>
            <dd className="font-medium">{shippingPrice} HUF</dd>
          </div>
          <div className="flex items-center justify-between border-t border-[#de6a44]/30 pt-2 text-base text-[#3a1d2d]">
            <dt className="font-semibold">Vegosszeg</dt>
            <dd className="font-bold">{orderTotal} HUF</dd>
          </div>
        </dl>
      </div>

      <div className="md:col-span-2 space-y-3 rounded-2xl border border-[#de6a44]/25 bg-white p-4">
        <label className="flex items-start gap-3 text-sm text-[#3a1d2d]">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#be3f6f]"
            required
          />
          <span>
            Elfogadom az{" "}
            <a href="/hu/aszf" className="font-semibold text-[#be3f6f] underline">
              ASZF-et
            </a>
            .
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-[#3a1d2d]">
          <input
            type="checkbox"
            checked={agreeGdpr}
            onChange={(e) => setAgreeGdpr(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#be3f6f]"
            required
          />
          <span>
            Elfogadom az{" "}
            <a href="/hu/adatkezeles" className="font-semibold text-[#be3f6f] underline">
              adatkezelesi tajekoztatot
            </a>
            .
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="md:col-span-2 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-6 py-3.5 font-semibold text-white shadow-md hover:from-[#0f766e] hover:to-[#115e59] disabled:opacity-50"
      >
        {loading ? "Kuldes..." : "Rendeles elkuldese"}
      </button>
    </form>
  );
}
