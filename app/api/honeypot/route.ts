import { NextRequest, NextResponse } from "next/server";
import { queryHoneypot, recordHit, sensorKeyConfigured, sensorKeyMatches } from "@/lib/server/honeypot";

const IP_RE = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$|^([0-9a-fA-F:]+:[0-9a-fA-F:.]+)$/;

export async function GET(req: NextRequest) {
  const ip = (req.nextUrl.searchParams.get("ip") || "").trim();
  if (!IP_RE.test(ip)) return NextResponse.json({ ok: false, error: "invalid_ip" }, { status: 400 });
  return NextResponse.json(queryHoneypot(ip));
}

export async function POST(req: NextRequest) {
  if (!sensorKeyConfigured()) {
    return NextResponse.json({ ok: false, error: "sensor_reporting_disabled" }, { status: 503 });
  }
  if (!sensorKeyMatches(req.headers.get("x-sensor-key"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: { src_ip?: string; sensor?: string; proto?: string; detail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const srcIp = (body.src_ip || "").trim();
  if (!IP_RE.test(srcIp)) return NextResponse.json({ ok: false, error: "invalid_src_ip" }, { status: 400 });
  recordHit(srcIp, String(body.sensor || "unknown").slice(0, 100), String(body.proto || "unknown").slice(0, 40), String(body.detail || "").slice(0, 500));
  return NextResponse.json({ ok: true });
}
