"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Market = "RO" | "HU";

type Props = {
  market: Market;
};

type FormState = {
  customerName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  shippingCarrier: "DPD" | "PPL";
};

const EMPTY: FormState = {
  customerName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
  shippingCarrier: "DPD",
};

export function TestCardOrderForm({ market }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const content = useMemo(() => {
    return market === "HU"
      ? {
          title: "Testovaci produkt - pouze platba kartou",
          subtitle: "Cena produktu: 15 HUF (test transakce Stripe: 250 HUF).",
          submit: "Vytvorit test objednavku",
          cardOnly: "Pouze karta (Stripe)",
          name: "Jmeno a prijmeni",
          email: "E-mail",
          phone: "Telefon",
          street: "Ulice a cislo domu",
          city: "Mesto",
          postal: "PSC (4 cislice)",
          carrier: "Doprava",
          fallback: "Objednavku se nepodarilo vytvorit.",
        }
      : {
          title: "Testovaci produkt - pouze platba kartou",
          subtitle: "Cena produktu: 1 RON (test transakce Stripe: 4 RON).",
          submit: "Vytvorit test objednavku",
          cardOnly: "Pouze karta (Stripe)",
          name: "Jmeno a prijmeni",
          email: "E-mail",
          phone: "Telefon",
          street: "Ulice a cislo domu",
          city: "Mesto",
          postal: "PSC (6 cifer)",
          carrier: "Doprava",
          fallback: "Objednavku se nepodarilo vytvorit.",
        };
  }, [market]);

  const setField = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const endpoint = market === "HU" ? "/api/hu/orders/test-card" : "/api/orders/test-card";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          shippingCarrier: form.shippingCarrier,
          delivery: {
            street: form.street,
            city: form.city,
            postalCode: form.postalCode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.orderId || !data?.orderNumber) {
        throw new Error(data?.message || "Request failed");
      }
      const base = market === "HU" ? "/hu/comanda/plata-card" : "/comanda/plata-card";
      router.push(
        `${base}?orderId=${encodeURIComponent(data.orderId)}&nr=${encodeURIComponent(String(data.orderNumber))}&test=1`
      );
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : content.fallback);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-[color:var(--brand-200)] bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold text-[color:var(--brand-700)]">{content.title}</h1>
      <p className="text-sm text-[color:var(--brand-700)]/70">{content.subtitle}</p>
      <p className="text-sm font-medium text-[color:var(--brand-700)]">{content.cardOnly}</p>

      <input value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} required className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2" placeholder={content.name} />
      <input value={form.email} onChange={(e) => setField("email", e.target.value)} required className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2" placeholder={content.email} />
      <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} required className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2" placeholder={content.phone} />
      <input value={form.street} onChange={(e) => setField("street", e.target.value)} required className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2" placeholder={content.street} />
      <input value={form.city} onChange={(e) => setField("city", e.target.value)} required className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2" placeholder={content.city} />
      <input value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} required className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2" placeholder={content.postal} />

      <label className="text-sm text-[color:var(--brand-700)]">{content.carrier}</label>
      <select value={form.shippingCarrier} onChange={(e) => setField("shippingCarrier", e.target.value)} className="rounded-lg border border-[color:var(--brand-200)] px-3 py-2">
        <option value="DPD">DPD</option>
        <option value="PPL">PPL</option>
      </select>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-full bg-[color:var(--brand-700)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "..." : content.submit}
      </button>
    </form>
  );
}
