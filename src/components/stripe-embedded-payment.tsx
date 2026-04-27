"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  orderId: string;
  orderNumber: string;
  market?: "RO" | "HU";
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function EmbeddedPaymentForm({ orderNumber, market = "RO" }: { orderNumber: string; market?: "RO" | "HU" }) {
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
      setError(confirmError.message || "Nu s-a putut confirma plata.");
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
        {loading ? "Se proceseaza plata..." : "Plateste acum"}
      </button>
    </form>
  );
}

export function StripeEmbeddedPayment({ orderId, orderNumber, market = "RO" }: Props) {
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
          setError(data.message || "Nu am putut initializa plata cu card.");
          return;
        }
        setClientSecret(data.clientSecret);
      } catch {
        if (active) {
          setError("Eroare la initializarea platii.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadIntent();
    return () => {
      active = false;
    };
  }, [orderId, market]);

  const options = useMemo(() => (clientSecret ? { clientSecret } : undefined), [clientSecret]);

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Plata cu cardul nu este inca activata (lipseste cheia publica Stripe).
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[#6b3b4d]">Se initializeaza plata securizata…</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link href="/comanda" className="text-sm font-medium text-[#be3f6f] underline">
          Inapoi la formular
        </Link>
      </div>
    );
  }

  if (!options) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <EmbeddedPaymentForm orderNumber={orderNumber} market={market} />
    </Elements>
  );
}
