// 网络连通性测试:浏览器本地向各站发轻量探测(favicon/204),多轮取中位延迟
// 结果反映"当前这条线路"到各站的真实连通情况,可用来验证分流规则是否符合预期
export type ConnGroup = "cn" | "jp" | "us" | "global";

export interface ConnSite {
  name: string;
  url: string; // 完整探测 URL
  group: ConnGroup;
}

export interface ConnResult {
  site: ConnSite;
  status: "pending" | "ok" | "fail";
  ms: number | null; // 中位延迟
}

const F = (host: string) => `https://${host}/favicon.ico`;

export const CONN_SITES: ConnSite[] = [
  // 中国
  { name: "DeepSeek", url: F("www.deepseek.com"), group: "cn" },
  { name: "抖音", url: F("www.douyin.com"), group: "cn" },
  { name: "哔哩哔哩", url: F("www.bilibili.com"), group: "cn" },
  { name: "京东", url: F("www.jd.com"), group: "cn" },
  { name: "腾讯QQ", url: F("im.qq.com"), group: "cn" },
  { name: "微信", url: "https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico", group: "cn" },
  { name: "小红书", url: F("www.xiaohongshu.com"), group: "cn" },
  { name: "新浪微博", url: F("weibo.com"), group: "cn" },
  { name: "百度", url: F("www.baidu.com"), group: "cn" },
  { name: "网易", url: F("www.163.com"), group: "cn" },
  { name: "淘宝", url: F("www.taobao.com"), group: "cn" },
  { name: "小米", url: F("www.mi.com"), group: "cn" },
  // 日本
  { name: "Sony", url: F("www.sony.com"), group: "jp" },
  { name: "任天堂", url: F("www.nintendo.co.jp"), group: "jp" },
  { name: "Yahoo! JP", url: F("www.yahoo.co.jp"), group: "jp" },
  { name: "LINE", url: F("line.me"), group: "jp" },
  // 美国
  { name: "Apple", url: F("www.apple.com"), group: "us" },
  { name: "Google", url: "https://www.google.com/generate_204", group: "us" },
  { name: "YouTube", url: "https://www.youtube.com/generate_204", group: "us" },
  { name: "GitHub", url: F("github.com"), group: "us" },
  { name: "Cloudflare", url: F("www.cloudflare.com"), group: "us" },
  { name: "Claude", url: F("claude.ai"), group: "us" },
  { name: "ChatGPT", url: F("chatgpt.com"), group: "us" },
  { name: "AI Studio", url: F("aistudio.google.com"), group: "us" },
  { name: "Amazon", url: F("www.amazon.com"), group: "us" },
  { name: "Bing", url: F("www.bing.com"), group: "us" },
  { name: "Steam", url: F("store.steampowered.com"), group: "us" },
  { name: "Oracle", url: F("www.oracle.com"), group: "us" },
  { name: "Zoom", url: F("zoom.us"), group: "us" },
  { name: "Facebook", url: F("www.facebook.com"), group: "us" },
  { name: "Instagram", url: F("www.instagram.com"), group: "us" },
  { name: "X", url: F("x.com"), group: "us" },
  { name: "Reddit", url: F("www.reddit.com"), group: "us" },
  { name: "LinkedIn", url: F("www.linkedin.com"), group: "us" },
  { name: "Twitch", url: F("www.twitch.tv"), group: "us" },
  { name: "Netflix", url: F("www.netflix.com"), group: "us" },
  // 全球
  { name: "TikTok", url: F("www.tiktok.com"), group: "global" },
  { name: "Spotify", url: F("open.spotify.com"), group: "global" },
  { name: "npm", url: F("registry.npmjs.org"), group: "global" },
  { name: "Takealot", url: F("www.takealot.com"), group: "global" },
  { name: "PixPix", url: F("pixpix.com"), group: "global" },
  { name: "Naver", url: F("www.naver.com"), group: "global" },
  { name: "Noon", url: F("www.noon.com"), group: "global" },
  { name: "Wikipedia", url: F("www.wikipedia.org"), group: "global" },
  { name: "BBC", url: F("www.bbc.com"), group: "global" },
  { name: "Mistral AI", url: F("mistral.ai"), group: "global" },
  { name: "Yandex", url: F("yandex.com"), group: "global" },
  { name: "MercadoLibre", url: F("www.mercadolibre.com"), group: "global" },
];

async function probeOnce(url: string, timeoutMs: number): Promise<number | null> {
  const t0 = performance.now();
  try {
    await fetch(`${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`, {
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return Math.round(performance.now() - t0);
  } catch {
    return null;
  }
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// 单站探测:2 轮取样,都失败判超时;中位延迟
export async function probeSite(site: ConnSite, timeoutMs = 8000, rounds = 2): Promise<ConnResult> {
  const samples: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const ms = await probeOnce(site.url, timeoutMs);
    if (ms !== null) samples.push(ms);
  }
  if (!samples.length) return { site, status: "fail", ms: null };
  return { site, status: "ok", ms: median(samples) };
}

// 分组探测,带进度回调
export async function probeGroup(group: ConnGroup, onOne?: (r: ConnResult) => void): Promise<ConnResult[]> {
  const sites = CONN_SITES.filter((s) => s.group === group);
  return Promise.all(
    sites.map(async (s) => {
      const r = await probeSite(s);
      onOne?.(r);
      return r;
    })
  );
}

// 延迟档位:优 <100 / 良 <300 / 慢 >=300 / 超时
export function latencyBand(ms: number | null): "great" | "ok" | "slow" | "fail" {
  if (ms === null) return "fail";
  return ms < 100 ? "great" : ms < 300 ? "ok" : "slow";
}
