"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EuDeliveryCountry, PaymentMethod } from "@/lib/types";
import { SHIPPING_CARRIERS, type ShippingCarrier } from "@/lib/types";

// DPD is intentionally not offered on the EU (RU/UA) checkout — PPL and
// Fineship cover DE/PL/AT delivery for this market.
const EU_SHIPPING_CARRIERS = SHIPPING_CARRIERS.filter((c) => c !== "DPD");
import { validateEuPostalCode } from "@/lib/eu-address";

type ApiOk = {
  ok: true;
  message?: string;
  orderId: string;
  orderNumber: number;
  paymentMethod: PaymentMethod;
};

type EuOrderFormLocale = "ru" | "uk";

const T: Record<EuOrderFormLocale, Record<string, string>> = {
  ru: {
    paymentMethodTitle: "Способ оплаты",
    cod: "Наложенный платёж",
    codNote: "Оплата курьеру при получении.",
    bank: "Банковский перевод",
    bankNote: "Отправим после зачисления оплаты.",
    card: "Банковская карта",
    cardNote: "Безопасная оплата через Stripe.",
    shippingTitle: "Доставка",
    fineshipNote: "Премиум, 1–3 дня.",
    pplNote: "PPL, 2–4 дня.",
    fineshipBadge: "Мин. 6 шт.",
    standardBadge: "бесплатно от 5 шт.",
    fullName: "Полное имя",
    email: "E-mail",
    phone: "Телефон",
    deliveryCountry: "Страна доставки",
    countryDe: "Германия (DE)",
    countryPl: "Польша (PL)",
    countryAt: "Австрия (AT)",
    street: "Улица, дом",
    city: "Город",
    postalCode: "Почтовый индекс",
    billingDifferent: "Адрес для счёта отличается от адреса доставки.",
    billingCompany: "Название компании",
    billingTaxId: "Налоговый номер",
    billingTradeRegNo: "Рег. номер",
    billingStreet: "Улица для счёта",
    billingCity: "Город для счёта",
    billingPostalCode: "Индекс для счёта",
    summaryTitle: "Итого",
    shippingLine: "Доставка",
    total: "К оплате",
    notes: "Комментарий к заказу (необязательно)",
    agreeTermsPrefix: "Принимаю",
    agreeTermsLink: "условия",
    agreeGdprPrefix: "Принимаю",
    agreeGdprLink: "политику конфиденциальности",
    submit: "Оформить заказ",
    submitting: "Отправка...",
    errName: "Укажите полное имя (имя и фамилия).",
    errEmail: "Неверный e-mail.",
    errPhone: "Неверный номер телефона.",
    errAddress: "Проверьте адрес доставки (улица, город, индекс).",
    errFineship: "Fineship доступен от 6 штук.",
    errBilling: "Заполните отдельные данные для счёта.",
    errAgree: "Примите условия и политику конфиденциальности.",
    errGeneric: "Ошибка при оформлении заказа.",
    errSubmit: "Не удалось отправить заказ. Попробуйте снова.",
    termsHref: "/eu/usloviya",
    gdprHref: "/eu/konfidencialnost",
    thanksHref: "/eu/comanda/multumesc",
    bankHref: "/eu/comanda/plata",
    cardHref: "/eu/comanda/plata-card",
  },
  uk: {
    paymentMethodTitle: "Спосіб оплати",
    cod: "Накладений платіж",
    codNote: "Оплата кур'єру при отриманні.",
    bank: "Банківський переказ",
    bankNote: "Надішлемо після зарахування оплати.",
    card: "Банківська картка",
    cardNote: "Безпечна оплата через Stripe.",
    shippingTitle: "Доставка",
    fineshipNote: "Преміум, 1–3 дні.",
    pplNote: "PPL, 2–4 дні.",
    fineshipBadge: "Мін. 6 шт.",
    standardBadge: "безкоштовно від 5 шт.",
    fullName: "Повне ім'я",
    email: "E-mail",
    phone: "Телефон",
    deliveryCountry: "Країна доставки",
    countryDe: "Німеччина (DE)",
    countryPl: "Польща (PL)",
    countryAt: "Австрія (AT)",
    street: "Вулиця, будинок",
    city: "Місто",
    postalCode: "Поштовий індекс",
    billingDifferent: "Адреса для рахунку відрізняється від адреси доставки.",
    billingCompany: "Назва компанії",
    billingTaxId: "Податковий номер",
    billingTradeRegNo: "Реєстраційний номер",
    billingStreet: "Вулиця для рахунку",
    billingCity: "Місто для рахунку",
    billingPostalCode: "Індекс для рахунку",
    summaryTitle: "Разом",
    shippingLine: "Доставка",
    total: "До сплати",
    notes: "Коментар до замовлення (необов'язково)",
    agreeTermsPrefix: "Приймаю",
    agreeTermsLink: "умови",
    agreeGdprPrefix: "Приймаю",
    agreeGdprLink: "політику конфіденційності",
    submit: "Оформити замовлення",
    submitting: "Надсилання...",
    errName: "Вкажіть повне ім'я (ім'я та прізвище).",
    errEmail: "Невірний e-mail.",
    errPhone: "Невірний номер телефону.",
    errAddress: "Перевірте адресу доставки (вулиця, місто, індекс).",
    errFineship: "Fineship доступний від 6 штук.",
    errBilling: "Заповніть окремі дані для рахунку.",
    errAgree: "Прийміть умови та політику конфіденційності.",
    errGeneric: "Помилка під час оформлення замовлення.",
    errSubmit: "Не вдалося надіслати замовлення. Спробуйте ще раз.",
    termsHref: "/eu/ua/umovy",
    gdprHref: "/eu/ua/konfidentsiynist",
    thanksHref: "/eu/ua/comanda/multumesc",
    bankHref: "/eu/ua/comanda/plata",
    cardHref: "/eu/ua/comanda/plata-card",
  },
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
  locale?: EuOrderFormLocale;
};

export function OrderFormEu({ unitPrice, standardShipping, fineshipShipping, locale = "ru" }: OrderFormEuProps) {
  const PRODUCT_NAME = "FreeStyle Libre 2 Plus";
  const t = T[locale];
  const apiOrdersPath = "/api/eu/orders";
  const apiCardPreparePath = "/api/eu/orders/card-prepare";

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
        setError(t.errName);
        setLoading(false);
        return;
      }
      if (!email.includes("@") || email.length < 5) {
        setError(t.errEmail);
        setLoading(false);
        return;
      }
      if (!/^\+?[0-9]{9,15}$/.test(phone)) {
        setError(t.errPhone);
        setLoading(false);
        return;
      }
      if (delivery.street.length < 5 || delivery.city.length < 2 || !validateEuPostalCode(delivery.country, delivery.postalCode)) {
        setError(t.errAddress);
        setLoading(false);
        return;
      }
      if (shippingCarrier === "FINESHIP" && quantityInput < 6) {
        setError(t.errFineship);
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
        setError(t.errBilling);
        setLoading(false);
        return;
      }
      if (!agreeTerms || !agreeGdpr) {
        setError(t.errAgree);
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
        const res = await fetch(apiCardPreparePath, {
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
          setError(data.message || t.errGeneric);
          return;
        }
        router.push(`${t.cardHref}?pendingId=${encodeURIComponent(data.pendingId)}`);
        return;
      }

      const res = await fetch(apiOrdersPath, {
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
        setError(data.message || t.errGeneric);
        return;
      }

      const nr = String(data.orderNumber);

      if (data.paymentMethod === "BANK_TRANSFER") {
        router.push(`${t.bankHref}?nr=${encodeURIComponent(nr)}`);
      } else {
        router.push(`${t.thanksHref}?nr=${encodeURIComponent(nr)}`);
      }
    } catch {
      setError(t.errSubmit);
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
        <h3 className="text-lg font-semibold text-[#0a2624]">{t.paymentMethodTitle}</h3>
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
              <span className="font-semibold text-[#0a2624]">{t.cod}</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">{t.codNote}</span>
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
              <span className="font-semibold text-[#0a2624]">{t.bank}</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">{t.bankNote}</span>
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
              <span className="font-semibold text-[#0a2624]">{t.card}</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">{t.cardNote}</span>
            </span>
          </label>
        </div>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-[#0a2624]">{t.shippingTitle}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {EU_SHIPPING_CARRIERS.map((c) => (
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
                <span className="block font-semibold text-[#0a2624]">{c === "PPL" ? "PPL" : "Fineship"}</span>
                {c === "FINESHIP" ? (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">{t.fineshipNote}</span>
                ) : (
                  <span className="mt-1 block text-sm leading-relaxed text-[#1a4d47]">{t.pplNote}</span>
                )}

                {c === "FINESHIP" ? (
                  <span className="mt-2 inline-flex rounded-full bg-[#f8d9c4] px-2.5 py-1 text-xs font-medium text-[#7a3f54]">
                    {t.fineshipBadge} • {fineshipShipping} €
                  </span>
                ) : (
                  <span className="mt-2 inline-flex rounded-full bg-[#e9f7f4] px-2.5 py-1 text-xs font-medium text-[#155e57]">
                    {standardShipping} € • {t.standardBadge}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <input
        name="deliveryFullName"
        placeholder={t.fullName}
        required
        value={deliveryFullName}
        onChange={(e) => setDeliveryFullName(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="email"
        type="email"
        placeholder={t.email}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="phone"
        placeholder={t.phone}
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
          <span className="mb-1 block text-[#1a4d47]">{t.deliveryCountry}</span>
          <select
            name="deliveryCountry"
            value={deliveryCountry}
            onChange={(e) => setDeliveryCountry(e.target.value as EuDeliveryCountry)}
            className="w-full rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
            required
          >
            <option value="DE">{t.countryDe}</option>
            <option value="PL">{t.countryPl}</option>
            <option value="AT">{t.countryAt}</option>
          </select>
        </label>
      </div>

      <input
        name="deliveryStreet"
        placeholder={t.street}
        required
        value={deliveryStreet}
        onChange={(e) => setDeliveryStreet(e.target.value)}
        className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryCity"
        placeholder={t.city}
        required
        value={deliveryCity}
        onChange={(e) => setDeliveryCity(e.target.value)}
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <input
        name="deliveryPostalCode"
        placeholder={t.postalCode}
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
          <span>{t.billingDifferent}</span>
        </label>
      </div>

      {billingDifferent ? (
        <>
          <input
            name="billingCompanyName"
            placeholder={t.billingCompany}
            required
            value={billingCompanyName}
            onChange={(e) => setBillingCompanyName(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTaxId"
            placeholder={t.billingTaxId}
            required
            value={billingTaxId}
            onChange={(e) => setBillingTaxId(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingTradeRegNo"
            placeholder={t.billingTradeRegNo}
            required
            value={billingTradeRegNo}
            onChange={(e) => setBillingTradeRegNo(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingStreet"
            placeholder={t.billingStreet}
            required
            value={billingStreet}
            onChange={(e) => setBillingStreet(e.target.value)}
            className="md:col-span-2 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingCity"
            placeholder={t.billingCity}
            required
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
          <input
            name="billingPostalCode"
            placeholder={t.billingPostalCode}
            required
                value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
            className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
          />
        </>
      ) : null}

      <div className="md:col-span-2 rounded-2xl border-2 border-[#de6a44]/25 bg-[#fff4ec] p-5">
        <h4 className="text-base font-semibold text-[#3a1d2d]">{t.summaryTitle}</h4>
        <dl className="mt-3 space-y-2 text-sm text-[#5c3046]">
          <div className="flex items-center justify-between">
            <dt>
              {PRODUCT_NAME} ({quantity} x {unitPrice} €)
            </dt>
            <dd className="font-medium">{productsTotal} €</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{t.shippingLine} ({carrier === "PPL" ? "PPL" : "Fineship"})</dt>
            <dd className="font-medium">{shippingPrice} €</dd>
          </div>
          <div className="flex items-center justify-between border-t border-[#de6a44]/30 pt-2 text-base text-[#3a1d2d]">
            <dt className="font-semibold">{t.total}</dt>
            <dd className="font-bold">{orderTotal} €</dd>
          </div>
        </dl>
      </div>

      <textarea
        name="additionalNotes"
        placeholder={t.notes}
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
            {t.agreeTermsPrefix}{" "}
            <a href={t.termsHref} className="font-semibold text-[#be3f6f] underline">
              {t.agreeTermsLink}
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
            {t.agreeGdprPrefix}{" "}
            <a href={t.gdprHref} className="font-semibold text-[#be3f6f] underline">
              {t.agreeGdprLink}
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
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
