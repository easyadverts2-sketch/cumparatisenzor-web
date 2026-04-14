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
  if (raw === "CARD_STRIPE") return "CARD_STRIPE";
  return "COD";
}

function parseShippingCarrier(raw: string): ShippingCarrier {
  const u = raw.toUpperCase();
  if (u === "PPL" || u === "PACKETA" || u === "FINESHIP" || u === "OTHER") {
    return u;
  }
  return "PPL";
}

export function OrderForm() {
  const UNIT_PRICE = 350;
  const STANDARD_SHIPPING = 10;
  const FINESHIP_SHIPPING = 200;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carrier, setCarrier] = useState<ShippingCarrier>("PPL");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingCarrierOther, setShippingCarrierOther] = useState("");

  const fineshipAllowed = quantity >= 6;

  useEffect(() => {
    if (!fineshipAllowed && carrier === "FINESHIP") {
      setCarrier("PPL");
    }
  }, [carrier, fineshipAllowed]);

  const shippingPrice =
    carrier === "FINESHIP" ? FINESHIP_SHIPPING : quantity >= 4 ? 0 : STANDARD_SHIPPING;
  const productsTotal = quantity * UNIT_PRICE;
  const orderTotal = productsTotal + shippingPrice;
  const customerStepReady =
    customerName.trim().length >= 3 &&
    email.includes("@") &&
    /^\+?[0-9]{9,15}$/.test(phone.replace(/\s+/g, "")) &&
    billingAddress.trim().length >= 8 &&
    deliveryAddress.trim().length >= 8;
  const shippingStepReady =
    carrier !== "OTHER" ? true : shippingCarrierOther.trim().length >= 2;
  const paymentStepReady = paymentMethod === "COD" || paymentMethod === "BANK_TRANSFER" || paymentMethod === "CARD_STRIPE";

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const shippingCarrier = parseShippingCarrier(String(formData.get("shippingCarrier") || "PPL"));
      const shippingCarrierOther =
        shippingCarrier === "OTHER" ? String(formData.get("shippingCarrierOther") || "").trim() : "";
      const customerName = String(formData.get("customerName") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").replace(/\s+/g, "");
      const billingAddress = String(formData.get("billingAddress") || "").trim();
      const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();
      const quantityInput = Math.max(1, Number(formData.get("quantity") || 1));
      const paymentMethodInput = parsePaymentMethod(String(formData.get("paymentMethod") || "COD"));

      if (customerName.length < 3) {
        setError("Numele complet trebuie sa aiba minimum 3 caractere.");
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
      if (billingAddress.length < 8 || deliveryAddress.length < 8) {
        setError("Adresele trebuie completate mai detaliat.");
        setLoading(false);
        return;
      }
      if (shippingCarrier === "OTHER" && shippingCarrierOther.length < 2) {
        setError("Specificati numele curierului pentru optiunea „Alt curier”.");
        setLoading(false);
        return;
      }
      if (shippingCarrier === "FINESHIP" && quantityInput < 6) {
        setError("Fineship este disponibil doar de la 6 bucati.");
        setLoading(false);
        return;
      }

      const payload = {
        customerName,
        email,
        phone,
        billingAddress,
        deliveryAddress,
        quantity: quantityInput,
        paymentMethod: paymentMethodInput,
        shippingCarrier,
        shippingCarrierOther: shippingCarrier === "OTHER" ? shippingCarrierOther : "",
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

      if (data.paymentMethod === "CARD_STRIPE") {
        router.push(
          `/comanda/plata-card?nr=${encodeURIComponent(nr)}&orderId=${encodeURIComponent(data.orderId)}`
        );
        return;
      }

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
                paymentStepReady ? "bg-[#e6f7f4] text-[#0f766e]" : "bg-white text-[#7a3f54]"
              }`}
            >
              3. Plata {paymentStepReady ? "✓" : ""}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-[#0a2624]">Metoda de plata</h3>
        <p className="mt-1 text-sm text-[#1a4d47]">
          Alegeti cum doriti sa platiti. La ramburs platiti curierului la livrare. La transfer
          bancar, expedem dupa ce plata este inregistrata. La card, veti fi redirectionat catre o
          pagina securizata (Stripe) dupa trimiterea comenzii.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
          <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f0faf8] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4]">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD_STRIPE"
              checked={paymentMethod === "CARD_STRIPE"}
              onChange={() => setPaymentMethod("CARD_STRIPE")}
              className="mt-1 accent-[#0d9488]"
            />
            <span>
              <span className="font-semibold text-[#0a2624]">Card bancar</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                Plata online securizata (Stripe). Disponibil cand serviciul este activat.
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
                  {c === "PPL"
                    ? "PPL"
                    : c === "PACKETA"
                      ? "Packeta"
                      : c === "FINESHIP"
                        ? "Fineship"
                        : "Alt curier"}
                </span>
                {c === "OTHER" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Specificati numele curierului mai jos (ex. GLS, DPD, Fan Courier).
                  </span>
                ) : c === "FINESHIP" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Livrare premium pentru comenzi mari.
                  </span>
                ) : c === "PPL" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Livrare standard prin reteaua PPL.
                  </span>
                ) : (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">
                    Livrare prin puncte Packeta / Z-Box etc.
                  </span>
                )}

                {c === "FINESHIP" ? (
                  <span className="mt-2 inline-flex rounded-full bg-[#f8d9c4] px-2.5 py-1 text-xs font-medium text-[#7a3f54]">
                    Min. 6 bucati • 200 RON
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        {carrier === "OTHER" ? (
          <input
            name="shippingCarrierOther"
            placeholder="Nume curier sau detalii livrare"
            required
            value={shippingCarrierOther}
            onChange={(e) => setShippingCarrierOther(e.target.value)}
            className="mt-4 w-full rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
          />
        ) : (
          <input type="hidden" name="shippingCarrierOther" value="" />
        )}
        {!fineshipAllowed ? (
          <p className="mt-2 text-xs text-[#7a3f54]">
            Pentru Fineship este necesara cantitatea minima de 6 senzori.
          </p>
        ) : null}
      </div>

      <input
        name="customerName"
        placeholder="Nume complet"
        required
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
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
      <textarea
        name="billingAddress"
        placeholder="Adresa facturare"
        required
        value={billingAddress}
        onChange={(e) => setBillingAddress(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80 md:col-span-2"
        rows={3}
      />
      <textarea
        name="deliveryAddress"
        placeholder="Adresa livrare"
        required
        value={deliveryAddress}
        onChange={(e) => setDeliveryAddress(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80 md:col-span-2"
        rows={3}
      />

      <div className="md:col-span-2 rounded-2xl border-2 border-[#de6a44]/25 bg-[#fff4ec] p-5">
        <h4 className="text-base font-semibold text-[#3a1d2d]">Sumar comanda</h4>
        <dl className="mt-3 space-y-2 text-sm text-[#5c3046]">
          <div className="flex items-center justify-between">
            <dt>Produse ({quantity} x {UNIT_PRICE} RON)</dt>
            <dd className="font-medium">{productsTotal} RON</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Livrare ({carrier === "PPL" ? "PPL" : carrier === "PACKETA" ? "Packeta" : carrier === "FINESHIP" ? "Fineship" : "Alt curier"})</dt>
            <dd className="font-medium">{shippingPrice} RON</dd>
          </div>
          <div className="flex items-center justify-between border-t border-[#de6a44]/30 pt-2 text-base text-[#3a1d2d]">
            <dt className="font-semibold">Total de plata</dt>
            <dd className="font-bold">{orderTotal} RON</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#6b3b4d]">
          Dupa trimiterea comenzii primiti confirmare pe e-mail. Pentru plata cu cardul veti continua pe formularul securizat Stripe.
        </p>
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
