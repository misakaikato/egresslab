import { NextResponse } from "next/server";

let cache: { at: number; body: any } | null = null;
const TTL = 300_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json(cache.body);
  }
  try {
    const res = await fetch("https://status.anthropic.com/api/v2/summary.json", {
      cache: "no-store",
      headers: { "user-agent": "exitlens/0.1" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const body = {
      ok: true,
      indicator: j?.status?.indicator ?? "unknown",
      description: j?.status?.description ?? "",
      components: (j?.components || []).map((c: any) => ({ name: c.name, status: c.status })),
      fetched_at: new Date().toISOString(),
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (e) {
    console.error("[api/claude/status]", e);
    return NextResponse.json({ ok: false, indicator: "unknown", description: "", components: [], fetched_at: new Date().toISOString() });
  }
}
