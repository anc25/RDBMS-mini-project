// GET /api/lost/mine - the logged-in user's own lost reports.
// (Static path, so Next.js matches this before /api/lost/[id].)

import { NextResponse } from "next/server";
import { getMyLostReports } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  return NextResponse.json(getMyLostReports(user.user_id));
}
