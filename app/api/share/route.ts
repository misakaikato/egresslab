import { NextRequest, NextResponse } from "next/server";

// 分享快照:入 SQLite,24h 过期;只存报告视图数据(≤24KB)
export async function POST(req: NextRequest) {
  let body: { data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const raw = JSON.stringify(body?.data ?? null);
  if (!raw || raw.length > 24_000 || raw === "null") {
    return NextResponse.json({ ok: false, error: "invalid_data" }, { status: 400 });
  }
  const id = Array.from({ length: 10 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  try {
    const { getDb, dbTry } = await import("@/lib/server/db");
    const ok = dbTry(() => {
      getDb().prepare("INSERT INTO shares(id, ts, ttl_ms, json) VALUES(?,?,?,?)").run(id, Date.now(), 86_400_000, raw);
      return true;
    }, false);
    if (!ok) return NextResponse.json({ ok: false, error: "store_failed" }, { status: 500 });
    return NextResponse.json({ ok: true, id, path: `/r/${id}` });
  } catch {
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
