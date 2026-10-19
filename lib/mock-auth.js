// =====================================================================
// lib/mock-auth.js
// Mock session handling. The logged-in user id is stored in an httpOnly
// cookie called "mock_user_id". All cookie logic lives in this one file
// so it is easy to swap for iron-session later.
// =====================================================================
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserById } from "./mock-store";

const COOKIE_NAME = "mock_user_id";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // one week
};

// Read the cookie and return the logged-in user (or null).
export async function getAuthedUser() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  const id = raw ? Number(raw) : NaN;
  if (!Number.isInteger(id)) return null;
  return getUserById(id);
}

// Attach the session cookie to a response (used by login / register).
export function setUserCookie(response, userId) {
  response.cookies.set(COOKIE_NAME, String(userId), COOKIE_OPTS);
  return response;
}

// Clear the session cookie (used by logout).
export function clearUserCookie(response) {
  response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 });
  return response;
}

// Ready-made error responses so every route answers identically.
export function unauthorized() {
  return NextResponse.json({ error: "Not logged in" }, { status: 401 });
}
export function forbidden() {
  return NextResponse.json({ error: "Admin only" }, { status: 403 });
}
