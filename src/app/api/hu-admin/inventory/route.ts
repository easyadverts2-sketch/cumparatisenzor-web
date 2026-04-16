import { readStore, writeStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { isHuAdminRequest } from "@/lib/admin-guard";

export async function POST(request: NextRequest) {
  if (!isHuAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const value = Number(body.inventory);
  if (!Number.isFinite(value) || value < 0) {
    return NextResponse.json({ ok: false, message: "Ervenytelen keszlet" }, { status: 400 });
  }

  const store = await readStore("HU");
  store.inventory = value;
  await writeStore(store, "HU");
  return NextResponse.json({ ok: true });
}
