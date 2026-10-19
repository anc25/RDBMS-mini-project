// GET /api/admin/stats - counters, hotspot locations, category
// breakdown and items unclaimed over 30 days. Admin only.

import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/mock-store";
import { forbidden, getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  return NextResponse.json(getAdminStats());
}
