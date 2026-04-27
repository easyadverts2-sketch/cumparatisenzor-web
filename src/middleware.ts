import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE_NAME = "admin_session";
const HU_ADMIN_SESSION_COOKIE_NAME = "hu_admin_session";

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "change-this-in-production";
}

function toHex(input: ArrayBuffer): string {
  return Array.from(new Uint8Array(input))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isValidSessionToken(token?: string): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!payload || !signature) return false;
  const keyData = new TextEncoder().encode(getAdminSessionSecret());
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const expected = toHex(expectedBuf);
  if (expected.length !== signature.length) return false;
  // Constant-time compare style for equal-length hex strings.
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), autoplay=()"
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  const headers = new Headers(request.headers);

  const isHuHost =
    hostname === "szenzorvasarlas.hu" || hostname === "www.szenzorvasarlas.hu";
  headers.set("x-site-variant", isHuHost ? "hu" : "ro");

  if (isHuHost) {
    const isStatic =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/icon") ||
      pathname.startsWith("/sensor-motif") ||
      pathname.startsWith("/brand-logo") ||
      pathname.startsWith("/libre-");

    if (!isStatic) {
      const url = request.nextUrl.clone();
      if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        url.pathname = pathname.replace(/^\/admin/, "/hu-admin");
        return applySecurityHeaders(NextResponse.rewrite(url, { request: { headers } }));
      }
      if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
        url.pathname = pathname.replace(/^\/api\/admin/, "/api/hu-admin");
        return applySecurityHeaders(NextResponse.rewrite(url, { request: { headers } }));
      }
      if (!pathname.startsWith("/hu") && !pathname.startsWith("/api")) {
        url.pathname = pathname === "/" ? "/hu" : `/hu${pathname}`;
        return applySecurityHeaders(NextResponse.rewrite(url, { request: { headers } }));
      }
    }
  } else if (
    pathname === "/hu" ||
    pathname.startsWith("/hu/") ||
    pathname === "/hu-admin" ||
    pathname.startsWith("/hu-admin/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isHuAdminPath = pathname.startsWith("/hu-admin") && !pathname.startsWith("/hu-admin/login");
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isHuAdminApiPath = pathname.startsWith("/api/hu-admin");
  const requiresAdminSession = isAdminPath || isHuAdminPath || isAdminApiPath || isHuAdminApiPath;

  if (!requiresAdminSession) {
    return applySecurityHeaders(NextResponse.next({ request: { headers } }));
  }

  const token = request.cookies.get(
    isHuAdminPath || isHuAdminApiPath ? HU_ADMIN_SESSION_COOKIE_NAME : ADMIN_SESSION_COOKIE_NAME
  )?.value;
  if (await isValidSessionToken(token)) {
    return applySecurityHeaders(NextResponse.next({ request: { headers } }));
  }

  if (isAdminApiPath || isHuAdminApiPath) {
    return applySecurityHeaders(
      NextResponse.json({ ok: false, message: "Unauthorized admin API request." }, { status: 401 })
    );
  }

  const loginUrl = new URL(isHuAdminPath ? "/hu-admin/login" : "/admin/login", request.url);
  return applySecurityHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
