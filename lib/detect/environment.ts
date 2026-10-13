// 中国大陆环境特征 7 信号:全部浏览器本地计算,不上传。权重与规则固化自规格。
import type { EnvSignal } from "../types";

export const ENV_WEIGHTS = { timezone: 30, language: 22, fonts: 14, vendorFonts: 12, cnBrowser: 10, deviceVendor: 6, locale: 6 } as const;
export type EnvKey = keyof typeof ENV_WEIGHTS;

const CN_TZ = ["Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "Asia/Chungking", "Asia/Harbin", "Asia/Kashgar", "PRC"];
const HK_MO_TZ = ["Asia/Hong_Kong", "Asia/Macau"];

export function cnTimezoneFrac(tz: string): number {
  if (CN_TZ.includes(tz)) return 1;
  if (HK_MO_TZ.includes(tz)) return 0.6;
  return 0;
}

// 语言表计分:zh-cn 首位=1.0;zh-hk/mo 首位=0.5;任意 zh-cn/hans=0.7;任意 zh=0.4
export function cnLanguageFrac(langs: string[]): number {
  const t = langs.map((l) => (l || "").toLowerCase()).filter(Boolean);
  if (!t.length) return 0;
  const isTW = (l: string) => l.startsWith("zh-tw") || (l.includes("hant") && l.includes("tw"));
  const isHKMO = (l: string) => l.startsWith("zh-hk") || l.startsWith("zh-mo");
  const hantIdx = t.findIndex((l) => isTW(l) || isHKMO(l) || l.includes("hant"));
  const isCN = (l: string, i: number) =>
    l.startsWith("zh-cn") || l.includes("hans") || (l === "zh" && (hantIdx === -1 || i < hantIdx));
  const filtered = t.map((l, i) => ({ l, i })).filter(({ l, i }) => !isTW(l) && !(l === "zh" && hantIdx !== -1 && i > hantIdx));
  const first = filtered[0];
  if (!first) return 0;
  if (isCN(first.l, first.i)) return 1;
  if (isHKMO(first.l) || first.l.includes("hant")) return 0.5;
  if (filtered.some(({ l, i }) => isCN(l, i))) return 0.7;
  if (t.some((l) => l.startsWith("zh"))) return 0.4;
  return 0;
}

export function cnIntlFrac(locale: string): number {
  const t = (locale || "").toLowerCase();
  if (t.startsWith("zh-cn") || t.includes("hans") || t === "zh") return 1;
  if (t.startsWith("zh")) return 0.5;
  return 0;
}

// ---- 以下为需要浏览器 API 的部分(纯函数已在上层导出供测试) ----
const SIMP_FONTS = ["Microsoft YaHei", "Microsoft YaHei UI", "SimSun", "NSimSun", "SimHei", "KaiTi", "FangSong", "DengXian", "PingFang SC", "Hiragino Sans GB", "STHeiti", "STSong", "Songti SC", "Source Han Sans CN", "Source Han Sans SC", "Noto Sans CJK SC", "Noto Serif CJK SC", "WenQuanYi Micro Hei", "WenQuanYi Zen Hei"];
const TRAD_FONTS = ["Microsoft JhengHei", "PMingLiU", "MingLiU", "DFKai-SB", "PingFang TC", "PingFang HK", "Source Han Sans TW", "Noto Sans CJK TC"];
const OS_PREINSTALLED: Record<string, string[]> = {
  mac: ["PingFang SC", "Hiragino Sans GB", "STHeiti", "STSong", "Songti SC", "Heiti SC"],
  ios: ["PingFang SC", "Hiragino Sans GB", "STHeiti", "STSong", "Songti SC", "Heiti SC"],
  windows: ["Microsoft YaHei", "Microsoft YaHei UI", "SimSun", "NSimSun"],
  linux: ["Noto Sans CJK SC", "Noto Serif CJK SC", "Source Han Sans SC", "Source Han Sans CN"],
  android: ["Noto Sans CJK SC", "Noto Serif CJK SC", "Source Han Sans SC", "Source Han Sans CN"],
};
const VENDOR_FONTS = ["MiSans", "MIUI", "HarmonyOS Sans SC", "HarmonyOS Sans", "HONOR Sans", "OPPO Sans", "vivo Sans", "Alibaba PuHuiTi", "Alibaba Sans", "DingTalk JinBuTi", "Douyin Sans", "HYQiHei", "FZShuSong-Z01S", "FZKai-Z03S", "FZHei-B01S", "FZFangSong-Z02S"];
const CN_BROWSERS: [RegExp, string][] = [
  [/micromessenger|wxwork/i, "WeChat"], [/mqqbrowser|qqbrowser|\bqq\//i, "QQ"], [/quark/i, "Quark"],
  [/ucbrowser|ucweb/i, "UC"], [/baiduboxapp|bidubrowser|baidubrowser/i, "Baidu"], [/miuibrowser|xiaomi\/|mibrowser/i, "Mi Browser"],
  [/huaweibrowser/i, "Huawei Browser"], [/heytapbrowser|oppobrowser/i, "OPPO Browser"], [/vivobrowser/i, "vivo Browser"],
  [/sogoumobilebrowser|\bmetasr\b|\bse 2\.x\b/i, "Sogou"], [/maxthon/i, "Maxthon"], [/360se|360ee|qihoobrowser|\bqhbrowser\b/i, "360"],
  [/2345explorer|2345browser/i, "2345"], [/lbbrowser/i, "Cheetah"], [/theworld/i, "TheWorld"],
  [/aweme|bytedancewebview|newsarticle|toutiaomicroapp/i, "Douyin/Toutiao"], [/alipayclient/i, "Alipay"], [/dingtalk/i, "DingTalk"],
  [/weibo/i, "Weibo"], [/xiaohongshu|xhsminiapp/i, "REDnote"], [/\bbilibili\b/i, "bilibili"],
];
const CN_DEVICES: [RegExp, string, number][] = [
  [/harmonyos|openharmony/i, "HarmonyOS", 1], [/huawei|\bhonor\b/i, "Huawei/HONOR", 0.8], [/meizu/i, "Meizu", 0.8],
  [/nubia|\bzte\b/i, "ZTE", 0.7], [/xiaomi|redmi|\bpoco\b|\bm2\d{3}[a-z0-9]+\b/i, "Xiaomi", 0.6],
  [/oppo|\bpd[a-z]m\d{2}\b/i, "OPPO", 0.6], [/vivo|\bv2\d{3}[a-z]{1,2}\b/i, "vivo", 0.6],
  [/realme|\brmx\d{4}\b/i, "realme", 0.6], [/oneplus/i, "OnePlus", 0.6], [/\blenovo\b|\bzuk\b/i, "Lenovo", 0.5],
];

function osFamily(ua: string): string {
  const t = (ua || "").toLowerCase();
  if (/iphone|ipad|ipod/.test(t)) return "ios";
  if (/android/.test(t)) return "android";
  if (/mac os|macintosh/.test(t)) return "mac";
  if (/windows/.test(t)) return "windows";
  if (/linux|cros/.test(t)) return "linux";
  return "other";
}

function fontExists(font: string, ctx: CanvasRenderingContext2D): boolean {
  const sample = "\u4e2d\u6587\u5b57\u4f53\u68c0\u6d4bABCabc012";
  for (const base of ["monospace", "sans-serif", "serif"]) {
    ctx.font = `72px ${base}`;
    const w0 = ctx.measureText(sample).width;
    ctx.font = `72px "${font}", ${base}`;
    if (Math.abs(ctx.measureText(sample).width - w0) > 0.5) return true;
  }
  return false;
}

function sig(key: EnvKey, frac: number, value: string): EnvSignal {
  const f = Math.max(0, Math.min(1, frac));
  const w = ENV_WEIGHTS[key];
  return { key, weight: w, frac: f, score: Math.round(f * w), value, pass: f < 0.25 };
}

function fontsFrac(os: string, simpExtra: string[], tradFound: string[]): { frac: number; value: string } {
  const preset = OS_PREINSTALLED[os] ?? [];
  const extra = simpExtra.filter((f) => !preset.includes(f));
  let frac = 0;
  let value = "";
  if (extra.length >= 2) { frac = 1; value = extra.slice(0, 4).join(", "); }
  else if (extra.length === 1) { frac = 0.8; value = extra[0]; }
  else if (os === "windows") {
    const zhPack = tradFound.filter((f) => f !== "Microsoft JhengHei");
    if (zhPack.length) { frac = 0.2; value = "zh language pack fonts"; }
  }
  if (!frac) value = simpExtra.length ? "system fonts only" : tradFound.length ? "trad fonts only" : "none";
  return { frac, value };
}

export interface EnvScanResult {
  items: EnvSignal[];
  score: number; // 0-100
  level: "high" | "medium" | "low";
  detail: { timezone: string; languages: string; intlLocale: string };
  platformSpoof: { fontContradiction: boolean; renderer: string };
}

export async function scanEnvironment(): Promise<EnvScanResult> {
  const items: EnvSignal[] = [];
  // 1. timezone
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
  items.push(sig("timezone", cnTimezoneFrac(tz), tz || "unknown"));
  // 2. language
  const langs = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((l) => l || "");
  items.push(sig("language", cnLanguageFrac(langs), langs.join(", ") || "unknown"));
  // 3/4. fonts
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    const simp = SIMP_FONTS.filter((f) => fontExists(f, ctx));
    const trad = TRAD_FONTS.filter((f) => fontExists(f, ctx));
    const ff = fontsFrac(osFamily(navigator.userAgent), simp, trad);
    items.push(sig("fonts", ff.frac, ff.value));
    const vf = VENDOR_FONTS.filter((f) => fontExists(f, ctx));
    items.push(sig("vendorFonts", vf.length >= 2 ? 1 : vf.length === 1 ? 0.8 : 0, vf.length ? vf.slice(0, 3).join(", ") : "none"));
  } else {
    items.push(sig("fonts", 0, "canvas unavailable"), sig("vendorFonts", 0, "canvas unavailable"));
  }
  // 5. CN browser
  const brands = (navigator as any).userAgentData?.brands?.map((b: { brand: string }) => b.brand).join(" ") || "";
  const uaAll = `${navigator.userAgent} ${brands}`;
  const hit = CN_BROWSERS.find(([re]) => re.test(uaAll));
  items.push(sig("cnBrowser", hit ? 1 : 0, hit ? hit[1] : "none"));
  // 6. device vendor (UA-CH high entropy)
  let extra = "";
  try {
    const hi = await (navigator as any).userAgentData?.getHighEntropyValues?.(["model", "platform"]);
    if (hi) extra = ` ${String(hi.model ?? "")} ${String(hi.platform ?? "")}`;
  } catch {}
  const dev = CN_DEVICES.find(([re]) => re.test(`${navigator.userAgent}${extra}`));
  items.push(sig("deviceVendor", dev ? dev[2] : 0, dev ? dev[1] : "none"));
  // 7. Intl locale
  let intlLocale = "";
  try { intlLocale = Intl.DateTimeFormat().resolvedOptions().locale || ""; } catch {}
  items.push(sig("locale", cnIntlFrac(intlLocale), intlLocale || "unknown"));
  const os = osFamily(navigator.userAgent);
  const MAC_FONTS = ["PingFang SC", "Hiragino Sans GB", "STHeiti", "STSong", "Songti SC"];
  const WIN_FONTS = ["Microsoft YaHei", "Microsoft YaHei UI", "SimSun", "NSimSun"];
  let simpFound: string[] = [];
  let tradFound: string[] = [];
  if (ctx) {
    simpFound = SIMP_FONTS.filter((f) => fontExists(f, ctx));
    tradFound = TRAD_FONTS.filter((f) => fontExists(f, ctx));
  }
  const fontContradiction =
    (os === "windows" && simpFound.some((f) => MAC_FONTS.includes(f)) && !simpFound.some((f) => WIN_FONTS.includes(f))) ||
    ((os === "mac" || os === "ios") && simpFound.some((f) => WIN_FONTS.includes(f)) && !simpFound.some((f) => MAC_FONTS.includes(f)));
  const score = Math.round(items.reduce((s, i) => s + i.score, 0));
  const level = score >= 61 ? "high" : score >= 31 ? "medium" : "low";
  return { items, score, level, detail: { timezone: tz, languages: langs.join(", "), intlLocale }, platformSpoof: { fontContradiction, renderer: "" } };
}
