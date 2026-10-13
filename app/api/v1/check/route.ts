import { NextRequest, NextResponse } from "next/server";
import { assessIp } from "@/lib/server/assess";

const IP_RE = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$|^([0-9a-fA-F:]+:[0-9a-fA-F:.]+)$/;

function authOk(req: NextRequest): boolean {
  const key = process.env.EGRESSLAB_API_KEY;
  if (!key) return true; // 未配置 = 不鉴权(自托管默认)
  return req.headers.get("x-api-key") === key;
}

async function handle(ips: string[], lang: string, single: boolean) {
  const results = [];
  for (const ip of ips.slice(0, 20)) {
    const clean = ip.trim();
    if (!IP_RE.test(clean)) {
      results.push({ ok: false, ip: clean, error: "invalid_ip" });
      continue;
    }
    try {
      results.push(await assessIp(clean, lang));
    } catch (e: any) {
      results.push({ ok: false, ip: clean, error: e?.statusCode === 502 ? "all_sources_failed" : "internal" });
    }
  }
  if (single) return NextResponse.json(results[0] ?? { ok: false, error: "no_ip" });
  return NextResponse.json({ ok: true, count: results.length, results });
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const ip = req.nextUrl.searchParams.get("ip") || "";
  const lang = req.nextUrl.searchParams.get("lang") || "zh";
  return handle([ip], lang, true);
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { ips?: string[]; ip?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const ips = Array.isArray(body.ips) ? body.ips : body.ip ? [body.ip] : [];
  if (!ips.length) return NextResponse.json({ ok: false, error: "no_ips" }, { status: 400 });
  return handle(ips, body.lang || "zh", false);
}
