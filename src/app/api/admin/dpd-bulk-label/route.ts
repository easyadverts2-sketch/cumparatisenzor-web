import { isAdminRequest } from "@/lib/admin-guard";
import { getDpdBulkLabelForOrders } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const orderIds = request.nextUrl.searchParams.getAll("orderIds").map((v) => String(v || "").trim()).filter(Boolean);
  const debug = String(request.nextUrl.searchParams.get("debug") || "").trim() === "1";
  const result = await getDpdBulkLabelForOrders(orderIds, "RO");
  if (debug || !result.ok) {
    return NextResponse.json(
      {
        ok: result.ok,
        orderIds,
        successCount: result.ok ? orderIds.length - result.failedOrders.length : 0,
        failedCount: result.failedOrders.length,
        failedOrders: result.failedOrders,
        endpointAttemptResults: "endpointAttemptResults" in result ? result.endpointAttemptResults : null,
        reason: result.ok ? null : result.reason,
      },
      { status: result.ok ? 200 : 409 }
    );
  }
  return new NextResponse(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
