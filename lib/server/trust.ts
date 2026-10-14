// IP 纯净度单值评分:100 起扣,信号全部来自已聚合的 IntelResult(零额外网络请求)
// 与六维评分的区别:六维是"Claude 风控视角的环境分"(含门控/浏览器维度),
// Trust 是"这个 IP 本身干不干净"的通用纯度分,适用于任意平台场景。
import type { IntelResult, TrustFactor, TrustResult } from "../types";

const FRESH_PREFIX_MS = 90 * 86400_000; // 90 天内宣告的前缀视为新鲜段

export function computeTrust(intel: IntelResult): TrustResult | null {
  const r = intel.risk;
  if (!r || !Object.keys(r).length) return null;
  const n = intel.network || {};
  let score = 100;
  const factors: TrustFactor[] = [];
  const dock = (key: string, delta: number, value?: string) => {
    if (delta <= 0) return;
    score -= delta;
    factors.push({ key, delta, value });
  };

  // 匿名/中转属性(硬信号,权重大)
  if (r.is_tor) dock("tor", 60);
  if (r.is_residential_proxy) dock("resproxy", 45);
  if (r.is_proxy) dock("proxy", 35);
  if (r.is_vpn) dock("vpn", 25);
  if (r.official_exit) dock("officialExit", 15, String(r.official_exit));

  // 网络类型(软信号)
  if (r.is_datacenter) dock("datacenter", 15);
  else {
    const t = (n.asn_type || "").toLowerCase();
    if (["hosting", "transit", "cdn", "idc"].some((k) => t.includes(k))) dock("asnHosting", 10);
  }

  // 信誉(连续量,截断上限)
  if (r.is_abuser) dock("abuser", 30);
  if (typeof r.abuse_score === "number" && r.abuse_score > 0) dock("abuse", Math.min(30, Math.round(r.abuse_score * 0.3)), String(r.abuse_score));
  if (typeof r.blacklist_score === "number" && r.blacklist_score > 0) dock("blacklist", Math.min(40, Math.round(r.blacklist_score * 0.4)), String(r.blacklist_score));

  // 邻居连坐 / 原生性 / 前缀年龄(微调)
  const nb = r.neighbors_flagged ?? 0;
  if (nb > 0) dock("neighbors", Math.min(10, nb * 5), String(nb));
  if (n.native === false) dock("nonNative", 5);
  if (r.prefix_first_seen) {
    const ts = new Date(r.prefix_first_seen).getTime();
    if (!Number.isNaN(ts) && Date.now() - ts < FRESH_PREFIX_MS) dock("freshPrefix", 8, String(r.prefix_first_seen).slice(0, 10));
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade: TrustResult["grade"] = score >= 80 ? "pure" : score >= 60 ? "good" : score >= 40 ? "fair" : score >= 20 ? "poor" : "bad";
  factors.sort((a, b) => b.delta - a.delta);
  return { score, grade, factors };
}
