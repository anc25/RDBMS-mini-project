// POST /api/login - check the credentials and set the session cookie.
// Mock mode: plain-text passwords in lib/mock-store.js. The real version
// will use bcryptjs.compare() against Users.password_hash.

import { NextResponse } from "next/server";
import { checkPassword, getUserByEmail, toPublicUser } from "@/lib/mock-store";
import { setUserCookie } from "@/lib/mock-auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  const user = getUserByEmail(email);
  if (!user || !checkPassword(user, password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }
  const response = NextResponse.json({ user: toPublicUser(user) });
  return setUserCookie(response, user.user_id);
}
