"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  orderId: string;
  orderNumber: string;
  market?: "RO" | "HU";
  uiLanguage?: "RO" | "HU" | "CS";
  backHref?: string;
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function EmbeddedPaymentForm({
  orderNumber,
  market = "RO",
  uiLanguage = "RO",
}: {
  orderNumber: string;
  market?: "RO" | "HU";
  uiLanguage?: "RO" | "HU" | "CS";
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!stripe || !elements) return;

    setLoading(true);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${market === "HU" ? "/hu/comanda/plata-card/rezultat" : "/comanda/plata-card/rezultat"}?nr=${encodeURIComponent(orderNumber)}`,
      },
    });
    if (confirmError) {
      setError(
        confirmError.message ||
          (uiLanguage === "CS"
            ? "Platbu se nepodarilo potvrdit."
            : uiLanguage === "HU"
              ? "A fizetest nem sikerult megerositeni."
              : "Nu s-a putut confirma plata.")
      );
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
        {loading
          ? uiLanguage === "CS"
            ? "Platba se zpracovava..."
            : uiLanguage === "HU"
              ? "Fizetes feldolgozasa..."
              : "Se proceseaza plata..."
          : uiLanguage === "CS"
            ? "Zaplatit ted"
            : uiLanguage === "HU"
              ? "Fizetes most"
              : "Plateste acum"}
      </button>
    </form>
  );
}

export function StripeEmbeddedPayment({
  orderId,
  orderNumber,
  market = "RO",
  uiLanguage = "RO",
  backHref,
}: Props) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadIntent() {
      try {
        const res = await fetch("/api/orders/card-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, market }),
        });
        const data = (await res.json()) as { ok: boolean; clientSecret?: string; message?: string };
        if (!active) return;
        if (!data.ok || !data.clientSecret) {
          setError(
            data.message ||
              (uiLanguage === "CS"
                ? "Platbu kartou se nepodarilo inicializovat."
                : uiLanguage === "HU"
                  ? "A kartyas fizetest nem sikerult inicializalni."
                  : "Nu am putut initializa plata cu card.")
          );
          return;
        }
        setClientSecret(data.clientSecret);
      } catch {
        if (active) {
          setError(
            uiLanguage === "CS"
              ? "Chyba pri inicializaci platby."
              : uiLanguage === "HU"
                ? "Hiba a fizetes inditasakor."
                : "Eroare la initializarea platii."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadIntent();
    return () => {
      active = false;
    };
  }, [orderId, market, uiLanguage]);

  const options = useMemo(() => (clientSecret ? { clientSecret } : undefined), [clientSecret]);

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {uiLanguage === "CS"
          ? "Platba kartou zatim neni aktivni (chybi verejny Stripe klic)."
          : uiLanguage === "HU"
            ? "A kartyas fizetes meg nincs aktivalva (hianyzik a nyilvanos Stripe kulcs)."
            : "Plata cu cardul nu este inca activata (lipseste cheia publica Stripe)."}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-[#6b3b4d]">
        {uiLanguage === "CS"
          ? "Inicializuje se zabezpecena platba..."
          : uiLanguage === "HU"
            ? "A biztonsagos fizetes inicializalasa..."
            : "Se initializeaza plata securizata…"}
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link href={backHref || "/comanda"} className="text-sm font-medium text-[#be3f6f] underline">
          {uiLanguage === "CS"
            ? "Zpet na formular"
            : uiLanguage === "HU"
              ? "Vissza az urlaphoz"
              : "Inapoi la formular"}
        </Link>
      </div>
    );
  }

  if (!options) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <EmbeddedPaymentForm orderNumber={orderNumber} market={market} uiLanguage={uiLanguage} />
    </Elements>
  );
}
