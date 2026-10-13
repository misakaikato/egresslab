import { NextRequest, NextResponse } from "next/server";

// 签名卡 SVG:访客自己的 IP + 归属 + 评分;爬虫代理(GitHub-Camo 等)显示占位
const THEMES: Record<string, { bg: string; bg2: string; fg: string; sub: string; accent: string; border: string }> = {
  paper: { bg: "#f6f4f0", bg2: "#fffefb", fg: "#26221d", sub: "#8a8378", accent: "#bc5527", border: "#e5dfd5" },
  graphite: { bg: "#2b2e33", bg2: "#33373d", fg: "#e8eaed", sub: "#9aa0a6", accent: "#8ab4f8", border: "#444a52" },
  ink: { bg: "#14120f", bg2: "#1c1915", fg: "#ece5da", sub: "#8b8172", accent: "#d97757", border: "#2e2820" },
  matrix: { bg: "#0a0f0a", bg2: "#0e140e", fg: "#c9f7c9", sub: "#4f8f4f", accent: "#39ff14", border: "#1d2b1d" },
  sakura: { bg: "#fdf2f4", bg2: "#fff8f9", fg: "#4a2b33", sub: "#b58a95", accent: "#e87ea1", border: "#f5d8de" },
  ocean: { bg: "#0d1b2a", bg2: "#12233a", fg: "#e0eaf5", sub: "#7f9cbaff", accent: "#48cae4", border: "#1e3a56" },
  sunset: { bg: "#2b1204", bg2: "#3a1a08", fg: "#ffe8d6", sub: "#c98d6b", accent: "#ff9e4f", border: "#4a2a12" },
  cyber: { bg: "#0f0a1e", bg2: "#150e2a", fg: "#e6e0ff", sub: "#8f86c9", accent: "#b14aed", border: "#2a1e4a" },
};

const BOT_UA = /GitHub-Camo|Discordbot|TelegramBot|Bytespider|Twitterbot|Slackbot|facebookexternalhit|WhatsApp|Preview|SkypeUriPreview/i;

function flagEmoji(cc?: string): string {
  if (!cc || cc.length !== 2 || !/^[a-zA-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(...cc.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface CardInfo {
  ip: string;
  country: string;
  city: string;
  score: number | null;
}

async function lookup(ip: string): Promise<CardInfo> {
  const info: CardInfo = { ip, country: "", city: "", score: null };
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    const j = await r.json();
    if (j?.success !== false) {
      info.country = String(j?.country || "");
      info.city = String(j?.city || "");
    }
  } catch {}
  try {
    const { getDb, dbTry } = await import("@/lib/server/db");
    const row = dbTry(() => getDb().prepare("SELECT last_score FROM rep_ip WHERE ip=?").get(ip) as any, undefined);
    if (row && typeof row.last_score === "number") info.score = row.last_score;
  } catch {}
  return info;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const style = q.get("style") || "paper";
  const th = THEMES[style] || THEMES.paper;
  const specifiedIp = (q.get("ip") || "").trim();
  const bot = BOT_UA.test(req.headers.get("user-agent") || "");

  let ip = specifiedIp;
  if (!ip && !bot) {
    ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "";
  }

  let info: CardInfo = { ip: ip || "", country: "", city: "", score: null };
  if (ip && !bot) info = await lookup(ip);

  const label = bot ? "IP hidden · open in browser" : info.ip || "no ip";
  const geo = bot ? "platform fetcher" : [info.city, info.country].filter(Boolean).join(", ");
  const cc = !bot && info.country ? (info.country.match(/[A-Z]{2}/)?.[0] || "") : "";
  const scoreColor = info.score === null ? th.sub : info.score >= 80 ? "#35a952" : info.score >= 60 ? "#eab308" : "#dc2626";
  const scoreText = bot ? "—" : info.score === null ? "✧" : String(info.score);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180" font-family="-apple-system,'Segoe UI','PingFang SC',sans-serif">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.bg}"/><stop offset="1" stop-color="${th.bg2}"/></linearGradient></defs>
  <rect width="480" height="180" rx="14" fill="url(#g)" stroke="${th.border}" stroke-width="1.5"/>
  <g transform="translate(26,34)">
    <path d="M30 12 V17 M30 25 V29 A6 6 0 0 1 24 35 H12 A6 6 0 0 1 6 29 V12 A6 6 0 0 1 12 6 H24 A6 6 0 0 1 30 12" fill="none" stroke="${th.fg}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="14" cy="21" r="3" fill="${th.accent}"/>
    <path d="M19 21 H29 M29 21 l-5 -3.4 M29 21 l-5 3.4" stroke="${th.accent}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="26" y="96" font-size="15" font-weight="700" fill="${th.fg}" letter-spacing="1">EXITLENS</text>
  <text x="26" y="122" font-size="16" font-family="ui-monospace,Menlo,monospace" fill="${th.accent}">${esc(label)}</text>
  <text x="26" y="144" font-size="11.5" fill="${th.sub}">${esc(geo)}${cc ? "  " + flagEmoji(cc) : ""}</text>
  <line x1="358" y1="34" x2="358" y2="146" stroke="${th.border}" stroke-width="1.5"/>
  <text x="419" y="95" font-size="38" font-weight="800" text-anchor="middle" fill="${scoreColor}" font-family="ui-monospace,Menlo,monospace">${scoreText}</text>
  <text x="419" y="116" font-size="10" text-anchor="middle" fill="${th.sub}">${bot || info.score === null ? "SCORE" : "SCORE /100"}</text>
  <text x="419" y="150" font-size="8.5" text-anchor="middle" fill="${th.sub}">exitlens · ip risk</text>
</svg>`;
  return new NextResponse(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });
}
