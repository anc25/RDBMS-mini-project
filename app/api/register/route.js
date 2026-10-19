// POST /api/register - create an account and start a session.
// Mock mode: the user row lives in lib/mock-store.js. The real version
// will hash the password with bcryptjs and insert into MySQL.

import { NextResponse } from "next/server";
import { createUser, toPublicUser } from "@/lib/mock-store";
import { setUserCookie } from "@/lib/mock-auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const password = String(body.password || "");

  // Server-side validation (the browser checks too, but never trust it).
  if (name.length < 2) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  if (!/^\d{6,15}$/.test(phone)) return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password needs at least 6 characters" }, { status: 400 });

  const result = createUser({ name, email, phone, password });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const response = NextResponse.json({ user: result.user });
  return setUserCookie(response, result.user.user_id);
}
