"use client";

import type { Order } from "@/lib/types";
import { formatOrderNumber } from "@/lib/order-format";
import Link from "next/link";
import { useMemo, useState } from "react";

function statusBucket(status: Order["status"]) {
  if (status === "ORDERED_PPLRDY") return "WAITING_FOR_SHIPPING";
  if (
    status === "CANCELLED_BY_US" ||
    status === "CANCELLED_BY_CUSTOMER" ||
    status === "CANCELLED_QUANTITY"
  ) {
    return "CANCELLED";
  }
  return status;
}

function statusLabel(status: Order["status"] | "CANCELLED") {
  switch (status) {
    case "ORDERED_NOT_PAID":
      return "Objednáno (převod)";
    case "ORDERED_PAID_NOT_SHIPPED":
      return "Zaplaceno převodem";
    case "WAITING_FOR_SHIPPING":
    case "ORDERED_PPLRDY":
      return "Čeká na odeslání";
    case "SHIPPED":
      return "Odesláno";
    case "CANCELLED":
    case "CANCELLED_BY_US":
    case "CANCELLED_BY_CUSTOMER":
    case "CANCELLED_QUANTITY":
      return "Zamítnuto";
    default:
      return status;
  }
}

function statusTone(status: Order["status"]) {
  switch (status) {
    case "ORDERED_NOT_PAID":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "ORDERED_PAID_NOT_SHIPPED":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "WAITING_FOR_SHIPPING":
    case "ORDERED_PPLRDY":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "SHIPPED":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "CANCELLED_BY_US":
    case "CANCELLED_BY_CUSTOMER":
    case "CANCELLED_QUANTITY":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function AdminOrdersList({
  orders,
  locale = "ro-RO",
  currency = "RON",
  detailsBasePath = "/admin/orders",
  deleteApiPath = "/api/admin/order-hard-delete",
  statusApiPath = "/api/admin/status",
  docxExportApiPath = "/api/admin/export/docx",
}: {
  orders: Order[];
  locale?: string;
  currency?: string;
  detailsBasePath?: string;
  deleteApiPath?: string;
  statusApiPath?: string;
  docxExportApiPath?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [statusByOrderId, setStatusByOrderId] = useState<Record<string, string>>({});
  const [exportBusy, setExportBusy] = useState(false);
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && statusBucket(o.status) !== statusFilter) return false;
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

  const allVisibleSelected = filtered.length > 0 && filtered.every((o) => selectedOrderIds.includes(o.id));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#0d4f4a]/10 bg-[#f8fcfb] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#0f766e]">Filtr stavu</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-2 border-[#0d4f4a]/20 bg-white px-3 py-2 text-[#0a2624]"
          >
            <option value="ALL">Vše</option>
            <option value="ORDERED_NOT_PAID">{statusLabel("ORDERED_NOT_PAID")}</option>
            <option value="ORDERED_PAID_NOT_SHIPPED">{statusLabel("ORDERED_PAID_NOT_SHIPPED")}</option>
            <option value="WAITING_FOR_SHIPPING">{statusLabel("WAITING_FOR_SHIPPING")}</option>
            <option value="SHIPPED">{statusLabel("SHIPPED")}</option>
            <option value="CANCELLED">{statusLabel("CANCELLED")}</option>
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
      </div>

      <p className="text-sm text-[#1a4d47]">
        Zobrazeno {filtered.length} z {orders.length} objednávek.
      </p>
      {uiMessage ? <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{uiMessage}</p> : null}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#0d4f4a]/10 bg-white p-3">
        <button
          className="rounded-lg border border-[#0d4f4a]/25 bg-white px-3 py-2 text-sm text-[#0a2624] hover:bg-[#f0faf8] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={exportBusy || selectedOrderIds.length === 0}
          onClick={async () => {
            setExportBusy(true);
            setUiMessage(null);
            try {
              const res = await fetch(docxExportApiPath, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderIds: selectedOrderIds }),
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { message?: string };
                setUiMessage(data.message || "DOCX export selhal.");
                setExportBusy(false);
                return;
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              const cd = res.headers.get("content-disposition") || "";
              const fileNameMatch = /filename=\"?([^\";]+)\"?/i.exec(cd);
              const fileName = fileNameMatch?.[1] || "orders-export.docx";
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              setExportBusy(false);
            } catch (err) {
              setUiMessage(err instanceof Error ? err.message : "DOCX export selhal.");
              setExportBusy(false);
            }
          }}
        >
          Export vybraných do DOCX
        </button>
        <button
          className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={deleteBusy || selectedOrderIds.length === 0}
          onClick={async () => {
            setDeleteBusy(true);
            setUiMessage(null);
            try {
              const endpoint = deleteApiPath.includes("/order-hard-delete")
                ? deleteApiPath.replace("/order-hard-delete", "/orders-bulk-hard-delete")
                : `${deleteApiPath}-bulk`;
              const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderIds: selectedOrderIds }),
              });
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; failedOrders?: Array<{ orderId: string; reason: string }> };
              if (!data.ok) {
                const extra = Array.isArray(data.failedOrders) && data.failedOrders.length > 0
                  ? ` Selhalo: ${data.failedOrders.map((x) => `${x.orderId}:${x.reason}`).join(", ")}`
                  : "";
                setUiMessage((data.message || "Bulk hard delete selhal.") + extra);
                setDeleteBusy(false);
                return;
              }
              window.location.reload();
            } catch (err) {
              setUiMessage(err instanceof Error ? err.message : "Bulk hard delete selhal.");
              setDeleteBusy(false);
            }
          }}
        >
          Smazat vybrané objednávky
        </button>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-xl border-2 border-[#0d4f4a]/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#e6f7f4] text-[#0a2624] shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const ids = Array.from(new Set([...selectedOrderIds, ...filtered.map((o) => o.id)]));
                      setSelectedOrderIds(ids);
                    } else {
                      setSelectedOrderIds(selectedOrderIds.filter((id) => !filtered.some((o) => o.id === id)));
                    }
                  }}
                />
              </th>
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
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(o.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, o.id])));
                      else setSelectedOrderIds(selectedOrderIds.filter((id) => id !== o.id));
                    }}
                  />
                </td>
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
                <td className="max-w-[180px] px-4 py-3 text-xs">
                  <span className={`inline-flex rounded-full border px-2 py-1 font-medium ${statusTone(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectStatuses: Order["status"][] = [
                          "ORDERED_NOT_PAID",
                          "ORDERED_PAID_NOT_SHIPPED",
                          "WAITING_FOR_SHIPPING",
                          "SHIPPED",
                          "CANCELLED_BY_US",
                        ];
                        const current = (statusByOrderId[o.id] ?? o.status) as Order["status"];
                        const options = selectStatuses.includes(current)
                          ? selectStatuses
                          : [...selectStatuses, current];
                        return (
                      <select
                        className="rounded border border-[#0d4f4a]/25 bg-white px-2 py-1 text-xs"
                        value={current}
                        onChange={(e) =>
                          setStatusByOrderId((prev) => ({ ...prev, [o.id]: e.target.value }))
                        }
                        disabled={statusBusyId === o.id}
                      >
                        {options.map((st) => (
                          <option key={st} value={st}>
                            {statusLabel(st)}
                          </option>
                        ))}
                      </select>
                        );
                      })()}
                      <button
                        className="rounded border border-[#0f766e]/30 bg-[#f0faf8] px-2 py-1 text-xs text-[#0f766e] hover:bg-[#e6f7f4]"
                        disabled={statusBusyId === o.id}
                        onClick={async () => {
                          setStatusBusyId(o.id);
                          setUiMessage(null);
                          try {
                            const nextStatus = statusByOrderId[o.id] ?? o.status;
                            const res = await fetch(statusApiPath, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ orderId: o.id, status: nextStatus }),
                            });
                            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
                            if (!data.ok) {
                              setUiMessage(data.message || "Zmena statusu selhala.");
                              setStatusBusyId(null);
                              return;
                            }
                            window.location.reload();
                          } catch (err) {
                            setUiMessage(err instanceof Error ? err.message : "Zmena statusu selhala.");
                            setStatusBusyId(null);
                          }
                        }}
                      >
                        Uložit status
                      </button>
                    </div>
                    <Link
                      href={`${detailsBasePath}/${o.orderNumber}`}
                      className="rounded px-1 py-1 font-medium text-[#0f766e] hover:bg-[#e6f7f4] hover:underline"
                    >
                      Detail
                    </Link>
                    <button
                      disabled={deleteBusy}
                      className="rounded px-1 py-1 text-xs text-red-700 hover:bg-red-50 hover:underline"
                      onClick={async () => {
                        setDeleteBusy(true);
                        setUiMessage(null);
                        try {
                          const res = await fetch(deleteApiPath, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderId: o.id }),
                          });
                          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
                          if (!data.ok) {
                            setUiMessage(data.message || "Hard delete selhal.");
                            setDeleteBusy(false);
                            return;
                          }
                          window.location.reload();
                        } catch (err) {
                          setUiMessage(err instanceof Error ? err.message : "Hard delete selhal.");
                          setDeleteBusy(false);
                        }
                      }}
                    >
                      Smazat objednavku
                    </button>
                  </div>
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
