import { getSql } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight readiness check (DB). Use after deploy: GET /api/health
 */
export async function GET() {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, service: "sensorsale-web", checks: { database: "missing_database_url" } },
      { status: 503 }
    );
  }

  try {
    const sql = getSql();
    await sql`SELECT 1 AS ok`;
    return NextResponse.json({ ok: true, service: "sensorsale-web", checks: { database: "ok" } });
  } catch {
    return NextResponse.json(
      { ok: false, service: "sensorsale-web", checks: { database: "unavailable" } },
      { status: 503 }
    );
  }
}
