"use client";

import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type Market = "RO" | "HU";
type IntentState = "loading" | "succeeded" | "processing" | "requires_payment_method" | "canceled" | "unknown";

type Props = {
  market: Market;
  orderNumber: string;
};

export function StripePaymentResult({ market, orderNumber }: Props) {
  const [intentState, setIntentState] = useState<IntentState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const params = new URLSearchParams(window.location.search);
        const clientSecret = params.get("payment_intent_client_secret");
        if (!clientSecret) {
          if (active) {
            setIntentState("unknown");
            setMessage("");
          }
          return;
        }
        const stripe = await stripePromise;
        if (!stripe) {
          if (active) {
            setIntentState("unknown");
            setMessage("");
          }
          return;
        }
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        if (!active) return;
        switch (paymentIntent?.status) {
          case "succeeded":
            setIntentState("succeeded");
            break;
          case "processing":
            setIntentState("processing");
            break;
          case "requires_payment_method":
            setIntentState("requires_payment_method");
            break;
          case "canceled":
            setIntentState("canceled");
            break;
          default:
            setIntentState("unknown");
            break;
        }
        setMessage(paymentIntent?.last_payment_error?.message || "");
      } catch (error) {
        if (active) {
          setIntentState("unknown");
          setMessage(error instanceof Error ? error.message : "");
        }
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const t = useMemo(() => {
    if (market === "HU") {
      return {
        titleSuccess: "Fizetes sikeres",
        titlePending: "Fizetes feldolgozas alatt",
        titleFailed: "Fizetes sikertelen",
        titleUnknown: "Fizetes allapota nem egyertelmu",
        orderLabel: "Rendelesszam",
        success: "A kartyas fizetes sikeresen megtortent. A rendeles feldolgozasat hamarosan megkezdjuk.",
        pending: "A fizetes folyamatban van. Par percen belul frissul a rendeles allapota.",
        failed: "A fizetes nem sikerult. Probald ujra ugyanahhoz a rendeleshez.",
        unknown: "A fizetes oldala visszatoltott, de a pontos allapotot most nem tudtuk ellenorizni.",
        retry: "Vissza a kartyas fizeteshez",
        home: "Vissza a fooldalra",
        support: "Ha hiba marad, irj nekunk: info@szenzorvasarlas.hu",
      };
    }
    return {
      titleSuccess: "Plata reusita",
      titlePending: "Plata este in procesare",
      titleFailed: "Plata nu a reusit",
      titleUnknown: "Statusul platii nu este clar",
      orderLabel: "Comanda nr.",
      success: "Plata cu cardul a fost confirmata cu succes. Vom incepe procesarea comenzii in scurt timp.",
      pending: "Plata este in curs de procesare. Statusul comenzii se va actualiza in cateva minute.",
      failed: "Plata nu a reusit. Puteti incerca din nou pentru aceeasi comanda.",
      unknown: "Pagina de plata s-a inchis corect, dar statusul exact nu a putut fi verificat acum.",
      retry: "Inapoi la plata cu cardul",
      home: "Inapoi la pagina principala",
      support: "Daca eroarea persista, scrieti-ne: info@cumparatisenzor.ro",
    };
  }, [market]);

  const title =
    intentState === "succeeded"
      ? t.titleSuccess
      : intentState === "processing"
        ? t.titlePending
        : intentState === "requires_payment_method" || intentState === "canceled"
          ? t.titleFailed
          : intentState === "loading"
            ? t.titlePending
            : t.titleUnknown;

  const body =
    intentState === "succeeded"
      ? t.success
      : intentState === "processing" || intentState === "loading"
        ? t.pending
        : intentState === "requires_payment_method" || intentState === "canceled"
          ? t.failed
          : t.unknown;

  const retryHref = market === "HU" ? "/hu/comanda/plata-card" : "/comanda/plata-card";
  const homeHref = market === "HU" ? "/hu" : "/";
  const colorClass =
    intentState === "succeeded"
      ? "border-[#0d9488]/30 from-[#e6f7f4]"
      : intentState === "requires_payment_method" || intentState === "canceled"
        ? "border-red-300 from-red-50"
        : "border-[#de6a44]/30 from-[#fff4ec]";

  return (
    <div className={`rounded-3xl border-2 bg-gradient-to-b to-white p-8 shadow-lg ${colorClass}`}>
      <h1 className="text-2xl font-bold text-[#0a2624]">{title}</h1>
      <p className="mt-2 font-semibold text-[#0f766e]">
        {t.orderLabel} {orderNumber}
      </p>
      <p className="mt-4 text-[#1a4d47]">{body}</p>
      {message ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
      <p className="mt-3 text-sm text-[#1a4d47]">{t.support}</p>
      {(intentState === "requires_payment_method" || intentState === "canceled" || intentState === "unknown") && (
        <Link
          href={retryHref}
          className="mt-6 inline-block rounded-xl bg-[#be3f6f] px-6 py-3 font-semibold text-white no-underline hover:bg-[#9d2f56]"
        >
          {t.retry}
        </Link>
      )}
      <Link
        href={homeHref}
        className="mt-6 ml-3 inline-block rounded-xl bg-[#0d9488] px-8 py-3 font-semibold text-white no-underline hover:bg-[#0f766e]"
      >
        {t.home}
      </Link>
    </div>
  );
}
