import { NextRequest, NextResponse } from "next/server";
import { aggregateIp } from "@/lib/server/intel/aggregate";
import { recordCheck } from "@/lib/server/reputation";
import { queryHoneypot } from "@/lib/server/honeypot";

const IP_RE = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$|^([0-9a-fA-F:]+:[0-9a-fA-F:.]+)$/;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ip: string }> }) {
  const { ip: raw } = await params;
  const ip = decodeURIComponent(raw || "").trim();
  if (!IP_RE.test(ip) || (ip.includes(".") && ip.split(".").some((o) => Number(o) > 255))) {
    return NextResponse.json({ ok: false, error: "invalid_ip" }, { status: 400 });
  }
  try {
    const result = await aggregateIp(ip);
    if (!result.private) {
      const hp = queryHoneypot(ip);
      recordCheck(ip, null, JSON.stringify({ risk: result.risk, geo: result.geo }));
      void hp;
    }
    return NextResponse.json(result);
  } catch (e: any) {
    if (e?.statusCode === 502) return NextResponse.json({ ok: false, error: "all_sources_failed" }, { status: 502 });
    console.error("[api/ip]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
