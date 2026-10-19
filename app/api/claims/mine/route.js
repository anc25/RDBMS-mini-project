// GET /api/claims/mine - the logged-in user's own claims.

import { NextResponse } from "next/server";
import { getMyClaims } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  return NextResponse.json(getMyClaims(user.user_id));
}
