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
  try {
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
    // Single atomic upsert instead of select-then-update: two concurrent
    // requests in the same window previously could both read the
    // pre-increment count and both pass, letting bursts exceed the limit.
    // The CASE expressions run inside Postgres's row lock for the conflicting
    // key, so the reset-vs-increment decision and the write happen together.
    const rows = await sql<{ count: number; window_start: string }[]>`
      insert into api_rate_limits (key, count, window_start)
      values (${key}, 1, ${now.toISOString()})
      on conflict (key) do update set
        count = case
          when now() - api_rate_limits.window_start >= (${params.windowSec} || ' seconds')::interval
            then 1
          else api_rate_limits.count + 1
        end,
        window_start = case
          when now() - api_rate_limits.window_start >= (${params.windowSec} || ' seconds')::interval
            then excluded.window_start
          else api_rate_limits.window_start
        end
      returning count, window_start
    `;

    const count = Number(rows[0]?.count || 0);
    const start = new Date(String(rows[0]?.window_start || now.toISOString()));
    const elapsedSec = Math.floor((now.getTime() - start.getTime()) / 1000);

    if (count > params.limit) {
      return { ok: false, retryAfterSec: Math.max(1, params.windowSec - elapsedSec) };
    }
  } catch {
    // Fail-open: never block checkout when rate-limit storage has an issue.
    return { ok: true };
  }
  return { ok: true };
}
