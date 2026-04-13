import { readStore, writeStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const value = Number(body.inventory);
  if (!Number.isFinite(value) || value < 0) {
    return NextResponse.json({ ok: false, message: "Stoc invalid" }, { status: 400 });
  }

  const store = await readStore();
  store.inventory = value;
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
