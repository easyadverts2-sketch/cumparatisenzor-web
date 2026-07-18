import { buildEuLlmsTxt } from "@/lib/eu-llms-txt";
import { getRequestSiteVariant } from "@/lib/site-url";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const variant = getRequestSiteVariant(headers());
  if (variant !== "eu") {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(buildEuLlmsTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
