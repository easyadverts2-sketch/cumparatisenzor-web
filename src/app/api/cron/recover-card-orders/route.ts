import { notifyInternalCardOrderIssue } from "@/lib/card-order-alerts";
import { recoverAllOrphanedCardPayments } from "@/lib/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await recoverAllOrphanedCardPayments();

  if (result.failed.length > 0) {
    await notifyInternalCardOrderIssue(
      "Automaticka obnova karty SELHALA",
      [
        `Cas: ${new Date().toISOString()}`,
        `Obnoveno: ${result.recovered.length}`,
        `Selhalo: ${result.failed.length}`,
        "",
        ...result.failed.map(
          (f) =>
            `- ${f.email || "?"} · ${f.market} · PI ${f.paymentIntentId || "?"} · ${f.error}`
        ),
      ].join("\n")
    );
  } else if (result.recovered.length > 0) {
    await notifyInternalCardOrderIssue(
      "Automaticka obnova karty OK",
      [
        `Cas: ${new Date().toISOString()}`,
        `Obnoveno ${result.recovered.length} objednavek:`,
        ...result.recovered.map(
          (r) => `- #${r.orderNumber} (${r.market}) · ${r.email} · PI ${r.paymentIntentId}`
        ),
      ].join("\n")
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
