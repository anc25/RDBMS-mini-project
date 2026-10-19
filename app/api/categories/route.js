// GET /api/categories - dropdown data (9 rows in the seed).

import { NextResponse } from "next/server";
import { listCategories } from "@/lib/mock-store";

export async function GET() {
  return NextResponse.json(listCategories());
}
