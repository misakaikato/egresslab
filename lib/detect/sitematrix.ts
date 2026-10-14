// 分流测试矩阵:向 ~40 个 Cloudflare 前置站点逐一发 /cdn-cgi/trace,
// 还原"每个网站看到的你是谁"——不同站点返回不同出口 IP 即分流生效的证据。
// 非 CF 站点(github/youtube 等)由 probeTrace 自动降级为 favicon 连通探测。
import { probeTrace } from "./trace";
import type { TraceProbe } from "../types";

export type SiteCat = "ai" | "social" | "crypto" | "tools" | "static" | "dev" | "media" | "speed" | "cn";

export interface SiteEntry {
  host: string;
  name: string;
  cat: SiteCat;
  region: "cn" | "intl";
  probePath?: string; // 非 CF 站点的自定义探测路径(默认 /favicon.ico)
}

export interface SiteProbe extends TraceProbe {
  name: string;
  cat: SiteCat;
  region: "cn" | "intl";
}

export const SITE_MATRIX: SiteEntry[] = [
  // ── 国内直连组(应为本地运营商出口;CF 中国节点可读 trace) ──
  { host: "www.taobao.com", name: "淘宝", cat: "cn", region: "cn" },
  { host: "res.wx.qq.com", name: "微信", cat: "cn", region: "cn", probePath: "/a/wx_fed/assets/res/NTI4MWU5.ico" },
  { host: "perfops.byte-test.com", name: "字节跳动", cat: "cn", region: "cn", probePath: "/500b-bench.jpg" },
  { host: "www.163.com", name: "网易", cat: "cn", region: "cn" },
  { host: "www.baidu.com", name: "百度", cat: "cn", region: "cn" },
  { host: "www.bilibili.com", name: "哔哩哔哩", cat: "cn", region: "cn" },
  { host: "www.cloudflare-cn.com", name: "Cloudflare 中国", cat: "cn", region: "cn" },
  { host: "www.qualcomm.cn", name: "高通中国", cat: "cn", region: "cn" },
  // ── AI ──
  { host: "claude.ai", name: "Claude", cat: "ai", region: "intl" },
  { host: "anthropic.com", name: "Anthropic", cat: "ai", region: "intl" },
  { host: "chatgpt.com", name: "ChatGPT", cat: "ai", region: "intl" },
  { host: "openai.com", name: "OpenAI", cat: "ai", region: "intl" },
  { host: "sora.com", name: "Sora", cat: "ai", region: "intl" },
  { host: "grok.com", name: "Grok", cat: "ai", region: "intl" },
  { host: "www.perplexity.ai", name: "Perplexity", cat: "ai", region: "intl" },
  { host: "midjourney.com", name: "Midjourney", cat: "ai", region: "intl" },
  { host: "mistral.ai", name: "Mistral", cat: "ai", region: "intl" },
  { host: "poe.com", name: "Poe", cat: "ai", region: "intl" },
  // ── 社交 ──
  { host: "x.com", name: "X", cat: "social", region: "intl" },
  { host: "medium.com", name: "Medium", cat: "social", region: "intl" },
  { host: "signal.org", name: "Signal", cat: "social", region: "intl" },
  { host: "gateway.discord.gg", name: "Discord", cat: "social", region: "intl" },
  // ── 加密货币 ──
  { host: "coinbase.com", name: "Coinbase", cat: "crypto", region: "intl" },
  { host: "www.okx.com", name: "OKX", cat: "crypto", region: "intl" },
  { host: "www.binance.info", name: "Binance", cat: "crypto", region: "intl" },
  { host: "crypto.com", name: "Crypto.com", cat: "crypto", region: "intl" },
  // ── 工具/SaaS ──
  { host: "zoom.us", name: "Zoom", cat: "tools", region: "intl" },
  { host: "1password.com", name: "1Password", cat: "tools", region: "intl" },
  { host: "wise.com", name: "Wise", cat: "tools", region: "intl" },
  { host: "notion.so", name: "Notion", cat: "tools", region: "intl" },
  { host: "shopify.com", name: "Shopify", cat: "tools", region: "intl" },
  { host: "godaddy.com", name: "GoDaddy", cat: "tools", region: "intl" },
  { host: "producthunt.com", name: "Product Hunt", cat: "tools", region: "intl" },
  // ── 静态资源/CDN ──
  { host: "cdnjs.cloudflare.com", name: "cdnjs", cat: "static", region: "intl" },
  { host: "registry.npmjs.org", name: "npm", cat: "static", region: "intl" },
  { host: "unpkg.com", name: "unpkg", cat: "static", region: "intl" },
  { host: "kali.download", name: "Kali", cat: "static", region: "intl" },
  // ── 开发 ──
  { host: "nodejs.org", name: "Node.js", cat: "dev", region: "intl" },
  { host: "gitlab.com", name: "GitLab", cat: "dev", region: "intl" },
  { host: "github.com", name: "GitHub", cat: "dev", region: "intl", probePath: "/favicon.ico" }, // 非 CF:仅连通
  // ── 媒体 ──
  { host: "crunchyroll.com", name: "Crunchyroll", cat: "media", region: "intl" },
  { host: "www.youtube.com", name: "YouTube", cat: "media", region: "intl", probePath: "/favicon.ico" }, // 非 CF:仅连通
  // ── Cloudflare 各网络 ──
  { host: "www.cloudflare.com", name: "Cloudflare", cat: "speed", region: "intl" },
  { host: "1.1.1.1", name: "1.1.1.1", cat: "speed", region: "intl" },
  { host: "speed.cloudflare.com", name: "CF 测速", cat: "speed", region: "intl" },
];

export async function probeSiteMatrix(timeoutMs = 7000, onOne?: (p: SiteProbe) => void): Promise<SiteProbe[]> {
  return Promise.all(
    SITE_MATRIX.map(async (s) => {
      const r = await probeTrace(s.host, timeoutMs, s.probePath);
      const out: SiteProbe = { ...r, name: s.name, cat: s.cat, region: s.region };
      onOne?.(out);
      return out;
    })
  );
}

export interface MatrixExit {
  ip: string;
  country: string;
  count: number;
  warp: boolean;
}

// 出口汇总:按 IP 聚合(仅统计拿到真实出口 IP 的 trace 命中)
export function matrixExits(sites: SiteProbe[]): MatrixExit[] {
  const map = new Map<string, MatrixExit>();
  for (const s of sites) {
    if (!s.ip || s.fallback) continue;
    const cur = map.get(s.ip) || { ip: s.ip, country: s.country || "", count: 0, warp: false };
    cur.count++;
    if (!cur.country && s.country) cur.country = s.country;
    if (s.warp === "on" || s.warp === "plus") cur.warp = true;
    map.set(s.ip, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
