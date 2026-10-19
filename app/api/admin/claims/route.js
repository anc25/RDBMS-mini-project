// GET /api/admin/claims?status=pending - the claim queue.
// Rows are shaped like the v_claim_details view. Admin only.

import { NextResponse } from "next/server";
import { getAdminClaims } from "@/lib/mock-store";
import { forbidden, getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET(request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const status = request.nextUrl.searchParams.get("status") || "pending";
  return NextResponse.json(getAdminClaims(status));
}
