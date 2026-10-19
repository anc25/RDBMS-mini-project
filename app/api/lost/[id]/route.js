// PATCH /api/lost/[id] - close one of the user's own reports.

import { NextResponse } from "next/server";
import { closeLostReport } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function PATCH(request, { params }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.status !== "closed") {
    return NextResponse.json({ error: "Only status \"closed\" is supported" }, { status: 400 });
  }

  const result = closeLostReport(user.user_id, reportId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
