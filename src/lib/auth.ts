import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const HU_COOKIE_NAME = "hu_admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "change-this-in-production";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken() {
  const payload = `${Date.now()}:${crypto.randomUUID()}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token?: string) {
  if (!token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  return sign(payload) === signature;
}

export function isAdminPasswordValid(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && input === password;
}

export function setAdminSessionCookie() {
  const token = createSessionToken();
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function hasAdminSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}

export const ADMIN_SESSION_COOKIE_NAME = COOKIE_NAME;
export const HU_ADMIN_SESSION_COOKIE_NAME = HU_COOKIE_NAME;

export function isHuAdminPasswordValid(input: string) {
  const password = process.env.HU_ADMIN_PASSWORD;
  return Boolean(password) && input === password;
}

export function setHuAdminSessionCookie() {
  const token = createSessionToken();
  cookies().set(HU_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearHuAdminSessionCookie() {
  cookies().delete(HU_COOKIE_NAME);
}

export function hasHuAdminSession() {
  const token = cookies().get(HU_COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}
