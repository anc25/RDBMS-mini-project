// GET /api/lost/[id]/matches - matches for one of my reports, best first.

import { NextResponse } from "next/server";
import { getReportMatches } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET(request, { params }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const result = getReportMatches(user.user_id, reportId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
