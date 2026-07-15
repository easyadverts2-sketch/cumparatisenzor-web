"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UiLanguage = "RO" | "HU" | "CS" | "RU" | "UK";

type Props = {
  /** Legacy: order already exists in DB before payment */
  orderId?: string;
  /** New flow: checkout prepared server-side, order created after Stripe success */
  pendingId?: string;
  orderNumber: string;
  market?: "RO" | "HU" | "EU";
  uiLanguage?: UiLanguage;
  backHref?: string;
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// Every uiLanguage branch used to be a repeated `=== "CS" ? … : === "HU" ? … : romanianFallback`
// ternary chain — any language missing from a given chain (RU, then UK) silently
// fell through to Romanian text. A single lookup table can't have that gap.
const STRINGS: Record<
  UiLanguage,
  {
    missingPaymentData: string;
    confirmFailed: string;
    payingNow: string;
    payNow: string;
    initFailed: string;
    initError: string;
    cardNotActive: string;
    initializing: string;
    backToForm: string;
  }
> = {
  RO: {
    missingPaymentData: "Lipsesc datele pentru plata.",
    confirmFailed: "Nu s-a putut confirma plata.",
    payingNow: "Se proceseaza plata...",
    payNow: "Plateste acum",
    initFailed: "Nu am putut initializa plata cu card.",
    initError: "Eroare la initializarea platii.",
    cardNotActive: "Plata cu cardul nu este inca activata (lipseste cheia publica Stripe).",
    initializing: "Se initializeaza plata securizata…",
    backToForm: "Inapoi la formular",
  },
  HU: {
    missingPaymentData: "Hianyoznak a fizetesi adatok.",
    confirmFailed: "A fizetest nem sikerult megerositeni.",
    payingNow: "Fizetes feldolgozasa...",
    payNow: "Fizetes most",
    initFailed: "A kartyas fizetest nem sikerult inicializalni.",
    initError: "Hiba a fizetes inditasakor.",
    cardNotActive: "A kartyas fizetes meg nincs aktivalva (hianyzik a nyilvanos Stripe kulcs).",
    initializing: "A biztonsagos fizetes inicializalasa...",
    backToForm: "Vissza az urlaphoz",
  },
  CS: {
    missingPaymentData: "Chybi udaje pro platbu.",
    confirmFailed: "Platbu se nepodarilo potvrdit.",
    payingNow: "Platba se zpracovava...",
    payNow: "Zaplatit ted",
    initFailed: "Platbu kartou se nepodarilo inicializovat.",
    initError: "Chyba pri inicializaci platby.",
    cardNotActive: "Platba kartou zatim neni aktivni (chybi verejny Stripe klic).",
    initializing: "Inicializuje se zabezpecena platba...",
    backToForm: "Zpet na formular",
  },
  RU: {
    missingPaymentData: "Не хватает данных для оплаты.",
    confirmFailed: "Не удалось подтвердить оплату.",
    payingNow: "Оплата обрабатывается...",
    payNow: "Оплатить сейчас",
    initFailed: "Не удалось инициализировать оплату картой.",
    initError: "Ошибка при инициализации оплаты.",
    cardNotActive: "Оплата картой пока не активна (отсутствует публичный ключ Stripe).",
    initializing: "Инициализация защищённой оплаты...",
    backToForm: "Вернуться к форме",
  },
  UK: {
    missingPaymentData: "Бракує даних для оплати.",
    confirmFailed: "Не вдалося підтвердити оплату.",
    payingNow: "Оплата обробляється...",
    payNow: "Оплатити зараз",
    initFailed: "Не вдалося ініціалізувати оплату карткою.",
    initError: "Помилка під час ініціалізації оплати.",
    cardNotActive: "Оплата карткою поки не активна (відсутній публічний ключ Stripe).",
    initializing: "Ініціалізація захищеної оплати...",
    backToForm: "Повернутися до форми",
  },
};

function EmbeddedPaymentForm({
  orderNumber,
  market = "RO",
  uiLanguage = "RO",
  pendingId,
}: {
  orderNumber: string;
  market?: "RO" | "HU" | "EU";
  uiLanguage?: UiLanguage;
  pendingId?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = STRINGS[uiLanguage];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!stripe || !elements) return;

    setLoading(true);
    const baseResult =
      market === "EU"
        ? "/eu/comanda/plata-card/rezultat"
        : market === "HU"
          ? "/hu/comanda/plata-card/rezultat"
          : "/comanda/plata-card/rezultat";
    const qs = new URLSearchParams();
    if (pendingId) qs.set("pendingId", pendingId);
    if (orderNumber && orderNumber !== "—" && orderNumber !== "-") {
      qs.set("nr", orderNumber);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${baseResult}${suffix}`,
      },
    });
    if (confirmError) {
      setError(confirmError.message || t.confirmFailed);
      setLoading(false);
      return;
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-[#be3f6f] px-6 py-3.5 font-semibold text-white hover:bg-[#9d2f56] disabled:opacity-60"
      >
        {loading ? t.payingNow : t.payNow}
      </button>
    </form>
  );
}

export function StripeEmbeddedPayment({
  orderId,
  pendingId,
  orderNumber,
  market = "RO",
  uiLanguage = "RO",
  backHref,
}: Props) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = STRINGS[uiLanguage];

  useEffect(() => {
    let active = true;
    async function loadIntent() {
      try {
        if (!orderId && !pendingId) {
          if (active) setError(t.missingPaymentData);
          return;
        }
        const res = await fetch("/api/orders/card-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            pendingId ? { pendingId, market } : { orderId, market }
          ),
        });
        const data = (await res.json()) as {
          ok: boolean;
          clientSecret?: string;
          message?: string;
        };
        if (!active) return;
        if (!data.ok || !data.clientSecret) {
          setError(data.message || t.initFailed);
          return;
        }
        setClientSecret(data.clientSecret);
      } catch {
        if (active) {
          setError(t.initError);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadIntent();
    return () => {
      active = false;
    };
  }, [orderId, pendingId, market, uiLanguage, t]);

  const options = useMemo(() => (clientSecret ? { clientSecret } : undefined), [clientSecret]);

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{t.cardNotActive}</p>;
  }

  if (loading) {
    return <p className="text-sm text-[#6b3b4d]">{t.initializing}</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link href={backHref || "/comanda"} className="text-sm font-medium text-[#be3f6f] underline">
          {t.backToForm}
        </Link>
      </div>
    );
  }

  if (!options) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <EmbeddedPaymentForm
        orderNumber={orderNumber}
        market={market}
        uiLanguage={uiLanguage}
        pendingId={pendingId}
      />
    </Elements>
  );
}
