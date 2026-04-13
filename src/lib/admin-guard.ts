import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, isValidSessionToken } from "./auth";

export function isAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}
