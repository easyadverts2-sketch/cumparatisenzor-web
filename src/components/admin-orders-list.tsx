"use client";

import type { Order } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { formatOrderNumber } from "@/lib/order-format";
import Link from "next/link";
import { useMemo, useState } from "react";

export function AdminOrdersList({
  orders,
  locale = "ro-RO",
  currency = "RON",
  detailsBasePath = "/admin/orders",
}: {
  orders: Order[];
  locale?: string;
  currency?: string;
  detailsBasePath?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        o.customerName.toLowerCase().includes(s) ||
        o.email.toLowerCase().includes(s) ||
        o.phone.includes(s) ||
        formatOrderNumber(o.orderNumber).includes(s) ||
        String(o.orderNumber).includes(s)
      );
    });
  }, [orders, statusFilter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#0f766e]">Filtr stavu</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-2 border-[#0d4f4a]/20 bg-white px-3 py-2 text-[#0a2624]"
          >
            <option value="ALL">Vše</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[200px] flex-1">
          <span className="text-xs font-medium text-[#0f766e]">Hledání (jméno, e-mail, telefon, č.)</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="…"
            className="mt-1 w-full rounded-lg border-2 border-[#0d4f4a]/20 bg-white px-3 py-2 text-[#0a2624]"
          />
        </label>
      </div>

      <p className="text-sm text-[#1a4d47]">
        Zobrazeno {filtered.length} z {orders.length} objednávek.
      </p>

      <div className="max-h-[65vh] overflow-auto rounded-xl border-2 border-[#0d4f4a]/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-[#e6f7f4] text-[#0a2624]">
            <tr>
              <th className="px-4 py-3 font-semibold">Nr.</th>
              <th className="px-4 py-3 font-semibold">Datum</th>
              <th className="px-4 py-3 font-semibold">Zákazník</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-[#0d4f4a]/10 hover:bg-[#f0faf8]">
                <td className="px-4 py-3 font-mono font-medium text-[#0f766e]">
                  {formatOrderNumber(o.orderNumber)}
                </td>
                <td className="px-4 py-3 text-[#1a4d47]">{new Date(o.createdAt).toLocaleString(locale)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0a2624]">{o.customerName}</div>
                  <div className="text-xs text-[#1a4d47]">{o.email}</div>
                </td>
                <td className="px-4 py-3 text-[#0a2624]">
                  {o.totalPrice} {currency}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-xs text-[#1a4d47]">{o.status}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`${detailsBasePath}/${o.orderNumber}`}
                    className="font-medium text-[#0f766e] hover:underline"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-[#1a4d47]">Žádná objednávka neodpovídá filtru.</p>
        ) : null}
      </div>
    </div>
  );
}
