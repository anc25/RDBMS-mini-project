// POST /api/admin/claims/[id]/reject - reject a pending claim with a note.
// When no other pending claims remain on the item, the item goes back to
// unclaimed (trg_claim_after_update). Admin only.

import { NextResponse } from "next/server";
import { rejectClaim } from "@/lib/mock-store";
import { forbidden, getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function POST(request, { params }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId)) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.admin_note || "").trim();
  if (!note) {
    return NextResponse.json({ error: "Admin note is required" }, { status: 400 });
  }

  const result = rejectClaim(claimId, user, note);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
