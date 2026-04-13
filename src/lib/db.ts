import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql__: ReturnType<typeof postgres> | undefined;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}

export function getSql() {
  if (!global.__sql__) {
    global.__sql__ = postgres(getDatabaseUrl(), {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });
  }
  return global.__sql__;
}
