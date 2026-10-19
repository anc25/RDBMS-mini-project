// POST /api/lost/[id]/rematch - re-run matching for one of my reports
// (the mock version of CALL sp_find_matches(report_id)).

import { NextResponse } from "next/server";
import { rematchReport } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function POST(request, { params }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const result = rematchReport(user.user_id, reportId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ matches_created: result.matches_created });
}
