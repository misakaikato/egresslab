import { NextResponse } from "next/server";

// 客户端能力配置:dnsleak 部署好并配置 env 后,检测页自动启用真 DNS 泄漏模块
export async function GET() {
  const zone = process.env.DNSLEAK_ZONE || "";
  const api = process.env.DNSLEAK_API || "";
  return NextResponse.json({
    ok: true,
    dnsleak: zone && api ? { zone, api } : null,
    turnstile: process.env.TURNSTILE_SITEKEY || null,
    recaptcha: process.env.RECAPTCHA_V3_SITEKEY || null,
  });
}
