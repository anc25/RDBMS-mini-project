// POST /api/logout - clear the session cookie.

import { NextResponse } from "next/server";
import { clearUserCookie } from "@/lib/mock-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearUserCookie(response);
}
