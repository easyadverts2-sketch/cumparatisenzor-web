import { getSql } from "./db";

type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip || "unknown";
}

function keyFor(request: Request, action: string) {
  const ip = getClientIp(request);
  return `${action}:${ip}`;
}

export async function enforceRateLimit(params: {
  request: Request;
  action: string;
  limit: number;
  windowSec: number;
}): Promise<LimitResult> {
  const sql = getSql();
  await sql`
    create table if not exists api_rate_limits (
      key text primary key,
      count integer not null,
      window_start timestamptz not null
    )
  `;

  const now = new Date();
  const key = keyFor(params.request, params.action);
  const row = await sql`
    select key, count, window_start
    from api_rate_limits
    where key = ${key}
    limit 1
  `;

  if (row.length === 0) {
    await sql`
      insert into api_rate_limits (key, count, window_start)
      values (${key}, 1, ${now.toISOString()})
    `;
    return { ok: true };
  }

  const count = Number(row[0].count || 0);
  const start = new Date(String(row[0].window_start));
  const elapsedSec = Math.floor((now.getTime() - start.getTime()) / 1000);
  if (elapsedSec >= params.windowSec) {
    await sql`
      update api_rate_limits
      set count = 1, window_start = ${now.toISOString()}
      where key = ${key}
    `;
    return { ok: true };
  }

  if (count >= params.limit) {
    return { ok: false, retryAfterSec: Math.max(1, params.windowSec - elapsedSec) };
  }

  await sql`
    update api_rate_limits
    set count = count + 1
    where key = ${key}
  `;
  return { ok: true };
}
