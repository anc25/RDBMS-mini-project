// GET /api/found/[id] - full detail of one found item.

import { NextResponse } from "next/server";
import { getFoundItemById } from "@/lib/mock-store";
import { getAuthedUser, unauthorized } from "@/lib/mock-auth";

export async function GET(request, { params }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const item = getFoundItemById(itemId);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}
