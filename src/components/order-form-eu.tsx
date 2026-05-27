"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EuDeliveryCountry, PaymentMethod } from "@/lib/types";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";
import { validateEuPostalCode } from "@/lib/eu-address";

type ApiOk = {
  ok: true;
  message?: string;
  orderId: string;
  orderNumber: number;
  paymentMethod: PaymentMethod;
};

function parsePaymentMethod(raw: string): PaymentMethod {
  if (raw === "CARD_STRIPE") return "CARD_STRIPE";
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

type OrderFormEuProps = {
  unitPrice: number;
  standardShipping: number;
  fineshipShipping: number;
};

export function OrderFormEu({ unitPrice, standardShipping, fineshipShipping }: OrderFormEuProps) {
  const PRODUCT_NAME = "FreeStyle Libre 2 Plus";

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
  const [deliveryCountry, setDeliveryCountry] = useState<EuDeliveryCountry>("DE");
  const [billingCountry, setBillingCountry] = useState<EuDeliveryCountry>("DE");
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billingCompanyName, setBillingCompanyName] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [billingTradeRegNo, setBillingTradeRegNo] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeGdpr, setAgreeGdpr] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const submitLockRef = useRef(false);

  const fineshipAllowed = quantity >= 6;

  useEffect(() => {
    if (!fineshipAllowed && carrier === "FINESHIP") {
      setCarrier("PPL");
    }
  }, [carrier, fineshipAllowed]);

  const shippingPrice =
    carrier === "FINESHIP" ? fineshipShipping : quantity >= 5 ? 0 : standardShipping;
  const productsTotal = quantity * unitPrice;
  const orderTotal = productsTotal + shippingPrice;

  async function onSubmit(formData: FormData) {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setLoading(true);
    setError("");
    try {
      const shippingCarrier = parseShippingCarrier(String(formData.get("shippingCarrier") || "PPL"));
      const customerName = String(formData.get("deliveryFullName") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").replace(/\s+/g, "");
      const quantityInput = Math.max(1, Number(formData.get("quantity") || 1));
      const paymentMethodInput = parsePaymentMethod(String(formData.get("paymentMethod") || "COD"));
      const deliveryCountryInput = String(formData.get("deliveryCountry") || deliveryCountry).toUpperCase() as EuDeliveryCountry;
      const delivery = {
        fullName: customerName,
        street: String(formData.get("deliveryStreet") || "").trim(),
        city: String(formData.get("deliveryCity") || "").trim(),
        postalCode: String(formData.get("deliveryPostalCode") || "").trim(),
        country: deliveryCountryInput,
      };
      const billingCountryInput = String(
        formData.get("billingCountry") || billingCountry || deliveryCountryInput
      ).toUpperCase() as EuDeliveryCountry;
      const billing = {
        different: String(formData.get("billingDifferent") || "") === "on",
        companyName: String(formData.get("billingCompanyName") || "").trim(),
        taxId: String(formData.get("billingTaxId") || "").trim(),
        tradeRegNo: String(formData.get("billingTradeRegNo") || "").trim(),
        street: String(formData.get("billingStreet") || "").trim(),
        city: String(formData.get("billingCity") || "").trim(),
        postalCode: String(formData.get("billingPostalCode") || "").trim(),
        country: billingCountryInput,
      };

      if (delivery.fullName.split(/\s+/).length < 2) {
        setError("Укажите полное имя (имя и фамилия).");
        setLoading(false);
        return;
      }
      if (!email.includes("@") || email.length < 5) {
        setError("Неверный e-mail.");
        setLoading(false);
        return;
      }
      if (!/^\+?[0-9]{9,15}$/.test(phone)) {
        setError("Неверный номер телефона.");
        setLoading(false);
        return;
      }
      if (delivery.street.length < 5 || delivery.city.length < 2 || !validateEuPostalCode(delivery.country, delivery.postalCode)) {
        setError("Проверьте адрес доставки (улица, город, индекс).");
        setLoading(false);
        return;
      }
      if (shippingCarrier === "FINESHIP" && quantityInput < 6) {
        setError("Fineship доступен от 6 штук.");
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
          !validateEuPostalCode(billing.country, billing.postalCode))
      ) {
        setError("Заполните отдельные данные для счёта.");
        setLoading(false);
        return;
      }
      if (!agreeTerms || !agreeGdpr) {
        setError("Примите условия и политику конфиденциальности.");
        setLoading(false);
        return;
      }

      const payload = {
        customerName: delivery.fullName,
        email,
        phone,
        delivery: { street: delivery.street, city: delivery.city, postalCode: delivery.postalCode, country: delivery.country },
        billing: { ...billing, country: billing.country },
        quantity: quantityInput,
        paymentMethod: paymentMethodInput,
        shippingCarrier,
        additionalNotes: String(formData.get("additionalNotes") || "").trim(),
      };

      if (paymentMethodInput === "CARD_STRIPE") {
        const res = await fetch("/api/eu/orders/card-prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("invalid_response");
        }
        const data = (await res.json()) as { ok: true; pendingId: string } | { ok: false; message?: string };
        if (!data.ok || !("pendingId" in data)) {
          setError(data.message || "Ошибка при оформлении заказа.");
          return;
        }
        router.push(`/eu/comanda/plata-card?pendingId=${encodeURIComponent(data.pendingId)}`);
        return;
      }

      const res = await fetch("/api/eu/orders", {
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
        setError(data.message || "Ошибка при оформлении заказа.");
        return;
      }

      const nr = String(data.orderNumber);

      if (data.paymentMethod === "BANK_TRANSFER") {
        router.push(`/eu/comanda/plata?nr=${encodeURIComponent(nr)}`);
      } else {
        router.push(`/eu/comanda/multumesc?nr=${encodeURIComponent(nr)}`);
      }
    } catch {
      setError("Не удалось отправить заказ. Попробуйте снова.");
    } finally {
      setLoading(false);
      submitLockRef.current = false;
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
        <h3 className="text-lg font-semibold text-[#0a2624]">Способ оплаты</h3>
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
              <span className="font-semibold text-[#0a2624]">Наложенный платёж</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                {carrier === "DPD"
                  ? "DPD szallitashoz Magyarorszagon utanvet jelenleg nem elerheto."
                  : "Оплата курьеру при получении."}
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
              <span className="font-semibold text-[#0a2624]">Банковский перевод</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">Отправим после зачисления оплаты.</span>
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
              <span className="font-semibold text-[#0a2624]">Банковская карта</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">Безопасная оплата через Stripe.</span>
            </span>
          </label>
        </div>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-[#0a2624]">Доставка</h3>
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
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">Премиум, 1–3 дня.</span>
                ) : c === "PPL" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">PPL, 2–4 дня.</span>
                ) : (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">DPD, 2–4 дня.</span>
                )}

                {c === "FINESHIP" ? (
                  <span className="mt-2 inline-flex rounded-full bg-[#f8d9c4] px-2.5 py-1 text-xs font-medium text-[#7a3f54]">
                    Мин. 6 шт. • {fineshipShipping} €
                  </span>
                ) : (
                  <span className="mt-2 inline-flex rounded-full bg-[#e9f7f4] px-2.5 py-1 text-xs font-medium text-[#155e57]">
                    {standardShipping} € • бесплатно от 5 шт.
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <input
        name="deliveryFullName"
        placeholder="Полное имя"
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
        placeholder="Телефон"
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

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-[#0a2624]">
          <span className="mb-1 block text-[#1a4d47]">Страна доставки</span>
          <select
            name="deliveryCountry"
            value={deliveryCountry}
            onChange={(e) => setDeliveryCountry(e.target.value as EuDeliveryCountry)}
            className="w-full rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
            required
          >
            <option value="DE">Германия (DE)</option>
            <option value="PL">Польша (PL)</option>
            <option value="AT">Австрия (AT)</option>
          </select>
        </label>
      </div>

      <input
        name="deliveryStreet"
        placeholder="Улица, дом"
        required
        value={deliveryStreet}
        onChange={(e) => setDeliveryStreet(e.target.value)}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryCity"
        placeholder="Город"
        required
        value={deliveryCity}
        onChange={(e) => setDeliveryCity(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryPostalCode"
        placeholder="Почтовый индекс"
        required
        value={deliveryPostalCode}
        onChange={(e) => setDeliveryPostalCode(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
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
          <span>Адрес для счёта отличается от адреса доставки.</span>
        </label>
      </div>

      {billingDifferent ? (
        <>
          <input
            name="billingCompanyName"
            placeholder="Название компании"
            required
            value={billingCompanyName}
            onChange={(e) => setBillingCompanyName(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTaxId"
            placeholder="Налоговый номер"
            required
            value={billingTaxId}
            onChange={(e) => setBillingTaxId(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTradeRegNo"
            placeholder="Рег. номер"
            required
            value={billingTradeRegNo}
            onChange={(e) => setBillingTradeRegNo(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingStreet"
            placeholder="Улица для счёта"
            required
            value={billingStreet}
            onChange={(e) => setBillingStreet(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingCity"
            placeholder="Город для счёта"
            required
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingPostalCode"
            placeholder="Индекс для счёта"
            required
                value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
        </>
      ) : null}

      <div className="md:col-span-2 rounded-2xl border-2 border-[#de6a44]/25 bg-[#fff4ec] p-5">
        <h4 className="text-base font-semibold text-[#3a1d2d]">Итого</h4>
        <dl className="mt-3 space-y-2 text-sm text-[#5c3046]">
          <div className="flex items-center justify-between">
            <dt>
              {PRODUCT_NAME} ({quantity} x {unitPrice} €)
            </dt>
            <dd className="font-medium">{productsTotal} €</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Доставка ({carrier === "PPL" ? "PPL" : carrier === "DPD" ? "DPD" : "Fineship"})</dt>
            <dd className="font-medium">{shippingPrice} €</dd>
          </div>
          <div className="flex items-center justify-between border-t border-[#de6a44]/30 pt-2 text-base text-[#3a1d2d]">
            <dt className="font-semibold">К оплате</dt>
            <dd className="font-bold">{orderTotal} €</dd>
          </div>
        </dl>
      </div>

      <textarea
        name="additionalNotes"
        placeholder="Комментарий к заказу (необязательно)"
        value={additionalNotes}
        onChange={(e) => setAdditionalNotes(e.target.value)}
        maxLength={1000}
        rows={4}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />

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
            Принимаю{" "}
            <a href="/eu/usloviya" className="font-semibold text-[#be3f6f] underline">
              условия
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
            Принимаю{" "}
            <a href="/eu/konfidencialnost" className="font-semibold text-[#be3f6f] underline">
              политику конфиденциальности
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
        {loading ? "Отправка..." : "Оформить заказ"}
      </button>
    </form>
  );
}
