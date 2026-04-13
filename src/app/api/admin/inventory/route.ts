import { readStore, writeStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
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
