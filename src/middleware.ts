import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE_NAME = "admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  if (!isAdminPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
