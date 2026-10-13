import { NextRequest, NextResponse } from "next/server";

// reCAPTCHA v3 服务端验证:token → Google siteverify → 返回 0.0-1.0 可信分
export async function POST(req: NextRequest) {
  const secret = process.env.RECAPTCHA_V3_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  let token = "";
  try {
    const b = await req.json();
    token = String(b?.token || "");
  } catch {}
  if (!token) return NextResponse.json({ ok: false, error: "no_token" }, { status: 400 });
  try {
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    return NextResponse.json({ ok: !!j?.success, score: typeof j?.score === "number" ? j.score : null, action: j?.action || "" });
  } catch {
    return NextResponse.json({ ok: false, error: "verify_failed" }, { status: 502 });
  }
}
