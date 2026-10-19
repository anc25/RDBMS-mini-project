// GET /api/me - the logged-in user, or 401 when there is no session.

import { NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ user });
}
