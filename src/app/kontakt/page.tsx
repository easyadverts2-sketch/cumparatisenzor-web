"use client";

import { useState } from "react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setOk("");
    setErr("");
    try {
      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        orderNumber: String(formData.get("orderNumber") || "").trim(),
        website: String(formData.get("website") || "").trim(),
      };
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setErr(data.message || "A aparut o eroare. Va rugam sa incercati din nou.");
        return;
      }
      setOk("Multumim! Mesajul a fost trimis.");
    } catch {
      setErr("A aparut o eroare. Va rugam sa incercati din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-[#0a2624]">Kontaktujte nas</h1>
      <p className="mt-2 text-[#1a4d47]">
        Aveti intrebari legate de comanda sau livrare? Scrieti-ne mai jos.
      </p>
      <form action={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-[#0d4f4a]/20 bg-white p-6 shadow-sm">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#0a2624]" htmlFor="name">
            Nume
          </label>
          <input id="name" name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#0a2624]" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#0a2624]" htmlFor="phone">
            Telefon (optional)
          </label>
          <input id="phone" name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#0a2624]" htmlFor="orderNumber">
            Numar comanda (optional)
          </label>
          <input id="orderNumber" name="orderNumber" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#0a2624]" htmlFor="message">
            Mesaj
          </label>
          <textarea id="message" name="message" required rows={6} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
        <p className="text-xs text-[#476864]">
          Campurile marcate sunt necesare pentru a raspunde solicitarii tale.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#0f766e] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Se trimite..." : "Trimite mesajul"}
        </button>
      </form>
    </main>
  );
}
