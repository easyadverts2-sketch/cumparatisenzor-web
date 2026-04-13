"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiOk = {
  ok: true;
  message?: string;
  orderId: string;
  orderNumber: number;
  paymentMethod: "COD" | "BANK_TRANSFER";
};

export function OrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
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

      const data = (await res.json()) as ApiOk | { ok: false; message?: string };
      if (!data.ok || !("orderNumber" in data)) {
        setError(data.message || "A aparut o eroare.");
        return;
      }

      const nr = String(data.orderNumber);
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
        <h3 className="text-lg font-semibold text-[#0a2624]">Metoda de plata</h3>
        <p className="mt-1 text-sm text-[#1a4d47]">
          Alegeti cum doriti sa platiti. La ramburs platiti curierului la livrare. La transfer
          bancar, expedem dupa ce plata este inregistrata in contul nostru.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f0faf8] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4]">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              defaultChecked
              className="mt-1 accent-[#0d9488]"
            />
            <span>
              <span className="font-semibold text-[#0a2624]">Ramburs (la livrare)</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                Platiti curierului cand primiti coletul. Comanda intra in procesare imediat.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-[#0d4f4a]/20 bg-[#f0faf8] p-4 has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#e6f7f4]">
            <input type="radio" name="paymentMethod" value="BANK_TRANSFER" className="mt-1 accent-[#0d9488]" />
            <span>
              <span className="font-semibold text-[#0a2624]">Transfer bancar</span>
              <span className="mt-1 block text-sm text-[#1a4d47]">
                Expediem dupa ce primim plata. Detaliile de plata le vedeti dupa trimiterea
                formularului si in e-mail.
              </span>
            </span>
          </label>
        </div>
      </div>

      <input
        name="customerName"
        placeholder="Nume complet"
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="phone"
        placeholder="Telefon"
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80"
      />
      <input
        name="quantity"
        type="number"
        min={1}
        defaultValue={1}
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624]"
      />
      <textarea
        name="billingAddress"
        placeholder="Adresa facturare"
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80 md:col-span-2"
        rows={3}
      />
      <textarea
        name="deliveryAddress"
        placeholder="Adresa livrare"
        required
        className="rounded-xl border-2 border-[#0d4f4a]/20 bg-[#fafdfb] p-3 text-[#0a2624] placeholder:text-[#3d6b66]/80 md:col-span-2"
        rows={3}
      />

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
