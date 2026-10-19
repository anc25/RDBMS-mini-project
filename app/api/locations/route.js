// GET /api/locations - dropdown data (8 rows in the seed).

import { NextResponse } from "next/server";
import { listLocations } from "@/lib/mock-store";

export async function GET() {
  return NextResponse.json(listLocations());
}
