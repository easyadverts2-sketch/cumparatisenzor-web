import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE_NAME = "admin_session";
const HU_ADMIN_SESSION_COOKIE_NAME = "hu_admin_session";

export function middleware(request: NextRequest) {
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
        return NextResponse.rewrite(url, { request: { headers } });
      }
      if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
        url.pathname = pathname.replace(/^\/api\/admin/, "/api/hu-admin");
        return NextResponse.rewrite(url, { request: { headers } });
      }
      if (!pathname.startsWith("/hu") && !pathname.startsWith("/api")) {
        url.pathname = pathname === "/" ? "/hu" : `/hu${pathname}`;
        return NextResponse.rewrite(url, { request: { headers } });
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
    return NextResponse.redirect(url);
  }

  const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isHuAdminPath = pathname.startsWith("/hu-admin") && !pathname.startsWith("/hu-admin/login");
  if (!isAdminPath && !isHuAdminPath) {
    return NextResponse.next({ request: { headers } });
  }

  const token = request.cookies.get(
    isHuAdminPath ? HU_ADMIN_SESSION_COOKIE_NAME : ADMIN_SESSION_COOKIE_NAME
  )?.value;
  if (token) {
    return NextResponse.next({ request: { headers } });
  }

  const loginUrl = new URL(isHuAdminPath ? "/hu-admin/login" : "/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
