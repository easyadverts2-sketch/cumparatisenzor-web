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
  if (u === "PPL" || u === "PACKETA" || u === "FINESHIP") {
    return u;
  }
  return "PPL";
}

export function OrderForm() {
  const UNIT_PRICE = 350;
  const STANDARD_SHIPPING = 40;
  const FINESHIP_SHIPPING = 200;

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

  const shippingPrice =
    carrier === "FINESHIP" ? FINESHIP_SHIPPING : quantity >= 5 ? 0 : STANDARD_SHIPPING;
  const productsTotal = quantity * UNIT_PRICE;
  const orderTotal = productsTotal + shippingPrice;
  const postalRegex = /^\d{6}$/;
  const customerStepReady =
    deliveryFullName.trim().split(/\s+/).length >= 2 &&
    email.includes("@") &&
    /^\+?[0-9]{9,15}$/.test(phone.replace(/\s+/g, "")) &&
    deliveryStreet.trim().length >= 5 &&
    deliveryCity.trim().length >= 2 &&
    postalRegex.test(deliveryPostalCode) &&
    deliveryCounty.trim().length >= 2;
  const shippingStepReady = carrier === "PPL" || carrier === "PACKETA" || carrier === "FINESHIP";
  const billingStepReady = !billingDifferent
    ? true
    : billingCompanyName.trim().length >= 2 &&
      billingTaxId.trim().length >= 2 &&
      billingTradeRegNo.trim().length >= 2 &&
      billingStreet.trim().length >= 5 &&
      billingCity.trim().length >= 2 &&
      postalRegex.test(billingPostalCode) &&
      billingCounty.trim().length >= 2;

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
        country: "RO",
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
        country: "RO",
      };

      if (delivery.fullName.split(/\s+/).length < 2) {
        setError("Introduceti nume si prenume pentru livrare.");
        setLoading(false);
        return;
      }
      if (!email.includes("@") || email.length < 5) {
        setError("Introduceti o adresa de e-mail valida.");
        setLoading(false);
        return;
      }
      if (!/^\+?[0-9]{9,15}$/.test(phone)) {
        setError("Telefon invalid. Folositi format numeric (minim 9 cifre).");
        setLoading(false);
        return;
      }
      if (
        delivery.street.length < 5 ||
        delivery.city.length < 2 ||
        !postalRegex.test(delivery.postalCode) ||
        delivery.county.length < 2
      ) {
        setError("Completati corect adresa de livrare din Romania (strada, oras, cod postal 6 cifre, judet).");
        setLoading(false);
        return;
      }
      if (shippingCarrier === "FINESHIP" && quantityInput < 6) {
        setError("Fineship este disponibil doar de la 6 bucati.");
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
        setError("Completati toate datele de facturare ale companiei (inclusiv CUI/CIF si Nr. Reg. Com.).");
        setLoading(false);
        return;
      }
      if (!agreeTerms || !agreeGdpr) {
        setError("Trebuie sa fiti de acord cu Termenii si conditiile si GDPR.");
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

      const res = await fetch("/api/orders", {
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
        setError(data.message || "A aparut o eroare.");
        return;
      }

      const nr = String(data.orderNumber);

      if (data.paymentMethod === "BANK_TRANSFER") {
        router.push(`/comanda/plata?nr=${encodeURIComponent(nr)}`);
      } else {
        router.push(`/comanda/multumesc?nr=${encodeURIComponent(nr)}`);
      }
    } catch {
      setError("A aparut o eroare la trimiterea comenzii. Va rugam sa incercati din nou.");
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
        <p className="md:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          {error}
        </p>
      ) : null}

      <div className="md:col-span-2">
        <div className="mb-5 rounded-2xl border border-[#de6a44]/30 bg-[#fff4ec] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7a3f54]">Progres comanda</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                customerStepReady ? "bg-[#e6f7f4] text-[#0f766e]" : "bg-white text-[#7a3f54]"
              }`}
            >
              1. Date client {customerStepReady ? "✓" : ""}
            </div>
            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                shippingStepReady ? "bg-[#e6f7f4] text-[#0f766e]" : "bg-white text-[#7a3f54]"
              }`}
            >
              2. Livrare {shippingStepReady ? "✓" : ""}
            </div>
            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                billingStepReady ? "bg-[#e6f7f4] text-[#0f766e]" : "bg-white text-[#7a3f54]"
              }`}
            >
              3. Facturare {billingStepReady ? "✓" : ""}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-[#0a2624]">Metoda de plata</h3>
        <p className="mt-1 text-sm text-[#1a4d47]">
          Alegeti cum doriti sa platiti. La ramburs platiti curierului la livrare. La transfer
          bancar, expedem dupa ce plata este inregistrata.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f0faf8] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4]">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              className="mt-1 accent-[#0d9488]"
            />
            <span>
              <span className="font-semibold text-[#0a2624]">Ramburs (la livrare)</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                Platiti curierului cand primiti coletul.
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
              <span className="font-semibold text-[#0a2624]">Transfer bancar</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                Expediem dupa ce primim plata in cont.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-[#0a2624]">Curier / livrare</h3>
        <p className="mt-1 text-sm text-[#1a4d47]">
          Selectati firma de curierat. Lista poate fi extinsa ulterior cu alti parteneri.
        </p>
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
                  {c === "PPL" ? "PPL" : c === "PACKETA" ? "DPD" : "Fineship"}
                </span>
                {c === "FINESHIP" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Livrare premium rapida, 1-3 zile de la comanda.
                  </span>
                ) : c === "PPL" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Livrare standard prin reteaua PPL, 2-4 zile.
                  </span>
                ) : (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Livrare standard prin reteaua DPD, 2-4 zile.
                  </span>
                )}

                {c === "FINESHIP" ? (
                  <span className="mt-2 inline-flex rounded-full bg-[#f8d9c4] px-2.5 py-1 text-xs font-medium text-[#7a3f54]">
                    Min. 6 bucati • 200 RON
                  </span>
                ) : (
                  <span className="mt-2 inline-flex rounded-full bg-[#e9f7f4] px-2.5 py-1 text-xs font-medium text-[#155e57]">
                    40 RON • Gratuit de la 5 bucati
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
        <input type="hidden" name="shippingCarrierOther" value="" />
        {!fineshipAllowed ? (
          <p className="mt-2 text-xs text-[#7a3f54]">
            Pentru Fineship este necesara cantitatea minima de 6 senzori.
          </p>
        ) : null}
      </div>

      <input
        name="deliveryFullName"
        placeholder="Nume si prenume (livrare)"
        required
        value={deliveryFullName}
        onChange={(e) => setDeliveryFullName(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="phone"
        placeholder="Telefon"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
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
        placeholder="Strada si numar (livrare)"
        required
        value={deliveryStreet}
        onChange={(e) => setDeliveryStreet(e.target.value)}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="deliveryCity"
        placeholder="Oras (livrare)"
        required
        value={deliveryCity}
        onChange={(e) => setDeliveryCity(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="deliveryPostalCode"
        placeholder="Cod postal (6 cifre)"
        required
        pattern="\d{6}"
        value={deliveryPostalCode}
        onChange={(e) => setDeliveryPostalCode(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="deliveryCounty"
        placeholder="Judet (livrare)"
        required
        value={deliveryCounty}
        onChange={(e) => setDeliveryCounty(e.target.value)}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
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
          <span>Adresa de facturare este diferita de adresa de livrare.</span>
        </label>
      </div>

      {billingDifferent ? (
        <>
          <input
            name="billingCompanyName"
            placeholder="Nume entitate / firma"
            required
            value={billingCompanyName}
            onChange={(e) => setBillingCompanyName(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTaxId"
            placeholder="CUI / CIF"
            required
            value={billingTaxId}
            onChange={(e) => setBillingTaxId(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTradeRegNo"
            placeholder="Nr. Reg. Com."
            required
            value={billingTradeRegNo}
            onChange={(e) => setBillingTradeRegNo(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingStreet"
            placeholder="Strada si numar (facturare)"
            required
            value={billingStreet}
            onChange={(e) => setBillingStreet(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingCity"
            placeholder="Oras (facturare)"
            required
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingPostalCode"
            placeholder="Cod postal facturare (6 cifre)"
            required
            pattern="\d{6}"
            value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingCounty"
            placeholder="Judet (facturare)"
            required
            value={billingCounty}
            onChange={(e) => setBillingCounty(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
        </>
      ) : null}

      <div className="md:col-span-2 rounded-2xl border-2 border-[#de6a44]/25 bg-[#fff4ec] p-5">
        <h4 className="text-base font-semibold text-[#3a1d2d]">Sumar comanda</h4>
        <dl className="mt-3 space-y-2 text-sm text-[#5c3046]">
          <div className="flex items-center justify-between">
            <dt>Produse ({quantity} x {UNIT_PRICE} RON)</dt>
            <dd className="font-medium">{productsTotal} RON</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Livrare ({carrier === "PPL" ? "PPL" : carrier === "PACKETA" ? "DPD" : "Fineship"})</dt>
            <dd className="font-medium">{shippingPrice} RON</dd>
          </div>
          <div className="flex items-center justify-between border-t border-[#de6a44]/30 pt-2 text-base text-[#3a1d2d]">
            <dt className="font-semibold">Total de plata</dt>
            <dd className="font-bold">{orderTotal} RON</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#6b3b4d]">
          Dupa trimiterea comenzii primiti confirmare pe e-mail cu detaliile de livrare si plata.
        </p>
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
            Sunt de acord cu{" "}
            <a href="/termeni-si-conditii" className="font-semibold text-[#be3f6f] underline">
              Termeni si conditii
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
            Sunt de acord cu{" "}
            <a href="/gdpr" className="font-semibold text-[#be3f6f] underline">
              politica GDPR
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
        {loading ? "Se trimite..." : "Trimite comanda"}
      </button>
    </form>
  );
}
