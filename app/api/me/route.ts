import { NextRequest, NextResponse } from "next/server";

// curl 友好回显 + 指纹用的服务器视角(时钟基准/头序/客户端提示头)
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const headerOrder = Array.from(req.headers.keys()).slice(0, 20);
  const interesting: Record<string, string> = {};
  for (const k of ["sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform", "accept", "accept-language", "user-agent", "accept-encoding"]) {
    const v = req.headers.get(k);
    if (v) interesting[k] = v;
  }
  const payload = {
    ok: true,
    ip,
    ts: new Date().toISOString(),
    mono: Date.now(),
    headerOrder,
    headers: {
      "user-agent": req.headers.get("user-agent") || "",
      "accept-language": req.headers.get("accept-language") || "",
      host: req.headers.get("host") || "",
      ...interesting,
    },
  };
  if (req.nextUrl.searchParams.get("format") === "text") {
    return new NextResponse(ip + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return NextResponse.json(payload);
}
