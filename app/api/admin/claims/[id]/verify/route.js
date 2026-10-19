// POST /api/admin/claims/[id]/verify - verify a claim.
// Mock mode mirrors sp_verify_claim: the item becomes claimed, the linked
// report becomes resolved, every other pending claim on the item is
// rejected with "Another claim was verified for this item", and a
// handover row is recorded. Admin only.

import { NextResponse } from "next/server";
import { verifyClaim } from "@/lib/mock-store";
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

  const result = verifyClaim(claimId, user, note);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
