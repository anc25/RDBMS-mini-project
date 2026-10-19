// GET /api/admin/audit - the latest 100 rows written by the triggers.
// Admin only.

import { NextResponse } from "next/server";
import { getAuditLog } from "@/lib/mock-store";
import { forbidden, getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  return NextResponse.json(getAuditLog());
}
