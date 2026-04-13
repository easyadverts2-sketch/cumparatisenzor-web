"use client";

import { useState } from "react";

export function OrderForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        customerName: String(formData.get("customerName") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        billingAddress: String(formData.get("billingAddress") || ""),
        deliveryAddress: String(formData.get("deliveryAddress") || ""),
        quantity: Number(formData.get("quantity") || 1),
        paymentMethod: String(formData.get("paymentMethod") || "COD"),
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

      const data = await res.json();
      setMessage(data.message || "A aparut o eroare.");
    } catch {
      setMessage("A aparut o eroare la trimiterea comenzii. Va rugam sa incercati din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
    >
      <input
        name="customerName"
        placeholder="Nume complet"
        required
        className="rounded-lg border border-slate-300 bg-white p-2.5"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        className="rounded-lg border border-slate-300 bg-white p-2.5"
      />
      <input
        name="phone"
        placeholder="Telefon"
        required
        className="rounded-lg border border-slate-300 bg-white p-2.5"
      />
      <input
        name="quantity"
        type="number"
        min={1}
        defaultValue={1}
        required
        className="rounded-lg border border-slate-300 bg-white p-2.5"
      />
      <textarea
        name="billingAddress"
        placeholder="Adresa facturare"
        required
        className="rounded-lg border border-slate-300 bg-white p-2.5 md:col-span-2"
      />
      <textarea
        name="deliveryAddress"
        placeholder="Adresa livrare"
        required
        className="rounded-lg border border-slate-300 bg-white p-2.5 md:col-span-2"
      />
      <select name="paymentMethod" className="rounded-lg border border-slate-300 bg-white p-2.5">
        <option value="COD">Ramburs</option>
        <option value="BANK_TRANSFER">Transfer bancar</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? "Se trimite..." : "Trimite comanda"}
      </button>
      {message ? <p className="md:col-span-2 text-sm font-medium text-slate-700">{message}</p> : null}
    </form>
  );
}
