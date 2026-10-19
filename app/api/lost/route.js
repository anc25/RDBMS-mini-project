// POST /api/lost - create a lost report, then run matching (FR4).

import { NextResponse } from "next/server";
import { createLostReport } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function POST(request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const result = createLostReport(user.user_id, body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ report_id: result.report_id });
}
