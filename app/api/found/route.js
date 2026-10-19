// app/api/found/route.js
//   POST /api/found       - report a found item
//   GET  /api/found?...   - search unclaimed items (category, location,
//                           from, to, q) - like the v_open_found_items view

import { NextResponse } from "next/server";
import { createFoundItem, listFoundItems } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function POST(request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const result = createFoundItem(user.user_id, body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ item_id: result.item_id });
}

export async function GET(request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  return NextResponse.json(
    listFoundItems({
      category: searchParams.get("category"),
      location: searchParams.get("location"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      q: searchParams.get("q"),
    })
  );
}
