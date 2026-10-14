import { NextResponse } from "next/server";
import { aggregateStatus } from "@/lib/server/statuspage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await aggregateStatus();
  return NextResponse.json(data, { headers: { "cache-control": "public, max-age=60" } });
}
