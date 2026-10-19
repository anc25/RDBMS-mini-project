// POST /api/claims - submit a claim on a found item.
// The mock store re-checks every rule from trg_claim_before_insert and
// returns the trigger's exact error message with status 409.

import { NextResponse } from "next/server";
import { createClaim } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function POST(request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const result = createClaim(user.user_id, body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ claim_id: result.claim_id });
}
