import { NextRequest, NextResponse } from "next/server";
import { queryReputation, recordFeedback } from "@/lib/server/reputation";

const IP_RE = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$|^([0-9a-fA-F:]+:[0-9a-fA-F:.]+)$/;

export async function GET(req: NextRequest) {
  const ip = (req.nextUrl.searchParams.get("ip") || "").trim();
  if (!IP_RE.test(ip)) return NextResponse.json({ ok: false, error: "invalid_ip" }, { status: 400 });
  return NextResponse.json(queryReputation(ip));
}

export async function POST(req: NextRequest) {
  let body: { ip?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const ip = (body.ip || "").trim();
  const note = String(body.note || "").slice(0, 200);
  if (!IP_RE.test(ip)) return NextResponse.json({ ok: false, error: "invalid_ip" }, { status: 400 });
  if (!note) return NextResponse.json({ ok: false, error: "empty_note" }, { status: 400 });
  recordFeedback(ip, note);
  return NextResponse.json({ ok: true });
}
