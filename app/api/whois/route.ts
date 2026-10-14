import { NextRequest, NextResponse } from "next/server";
import { rdapLookup } from "@/lib/server/rdap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ ok: false, error: "missing_q" }, { status: 400 });
  const r = await rdapLookup(q);
  const status = r.ok ? 200 : r.error === "invalid" ? 400 : r.error === "not_found" ? 404 : 502;
  return NextResponse.json(r, { status, headers: { "cache-control": "public, max-age=300" } });
}
