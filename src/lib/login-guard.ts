import { headers } from "next/headers";
import { getSql } from "./db";

type LoginMarket = "RO" | "HU";

function getClientIp() {
  const hdrs = headers();
  const forwarded = hdrs.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip || "unknown";
}

function keyFor(market: LoginMarket) {
  return `${market.toLowerCase()}:${getClientIp()}`;
}

async function ensureSchema() {
  const sql = getSql();
  await sql`
    create table if not exists admin_login_attempts (
      key text primary key,
      failed_count integer not null,
      first_failed_at timestamptz not null,
      lock_until timestamptz
    )
  `;
  return sql;
}

export async function isLoginLocked(market: LoginMarket): Promise<{ locked: boolean; retryAfterSec?: number }> {
  const sql = await ensureSchema();
  const key = keyFor(market);
  const rows = await sql`
    select failed_count, first_failed_at, lock_until
    from admin_login_attempts
    where key = ${key}
    limit 1
  `;
  if (rows.length === 0) return { locked: false };
  const lockUntilRaw = rows[0].lock_until;
  if (!lockUntilRaw) return { locked: false };
  const lockUntil = new Date(String(lockUntilRaw)).getTime();
  const now = Date.now();
  if (lockUntil <= now) {
    await sql`delete from admin_login_attempts where key = ${key}`;
    return { locked: false };
  }
  return { locked: true, retryAfterSec: Math.ceil((lockUntil - now) / 1000) };
}

export async function recordFailedLogin(market: LoginMarket): Promise<{ locked: boolean; retryAfterSec?: number }> {
  const sql = await ensureSchema();
  const key = keyFor(market);
  const now = new Date();
  const rows = await sql`
    select failed_count, first_failed_at
    from admin_login_attempts
    where key = ${key}
    limit 1
  `;

  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;
  const lockMs = 30 * 60 * 1000;

  if (rows.length === 0) {
    await sql`
      insert into admin_login_attempts (key, failed_count, first_failed_at, lock_until)
      values (${key}, 1, ${now.toISOString()}, null)
    `;
    return { locked: false };
  }

  const firstFailedAt = new Date(String(rows[0].first_failed_at)).getTime();
  const failedCount = Number(rows[0].failed_count || 0);
  const elapsed = now.getTime() - firstFailedAt;

  if (elapsed > windowMs) {
    await sql`
      update admin_login_attempts
      set failed_count = 1, first_failed_at = ${now.toISOString()}, lock_until = null
      where key = ${key}
    `;
    return { locked: false };
  }

  const nextCount = failedCount + 1;
  if (nextCount >= maxAttempts) {
    const lockUntil = new Date(now.getTime() + lockMs).toISOString();
    await sql`
      update admin_login_attempts
      set failed_count = ${nextCount}, lock_until = ${lockUntil}
      where key = ${key}
    `;
    return { locked: true, retryAfterSec: Math.ceil(lockMs / 1000) };
  }

  await sql`
    update admin_login_attempts
    set failed_count = ${nextCount}
    where key = ${key}
  `;
  return { locked: false };
}

export async function clearLoginFailures(market: LoginMarket) {
  const sql = await ensureSchema();
  const key = keyFor(market);
  await sql`delete from admin_login_attempts where key = ${key}`;
}
