import { NextRequest, NextResponse } from "next/server";

// curl 友好回显:curl localhost:3000/api/me 或 ?format=text
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const payload = {
    ok: true,
    ip,
    ts: new Date().toISOString(),
    headers: {
      "user-agent": req.headers.get("user-agent") || "",
      "accept-language": req.headers.get("accept-language") || "",
      host: req.headers.get("host") || "",
    },
  };
  if (req.nextUrl.searchParams.get("format") === "text") {
    return new NextResponse(ip + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return NextResponse.json(payload);
}
