// 服务端 IP 评估:情报聚合 + 评分(服务端可见维度)+ 自然语言结论 + 蜜罐/信誉
import { aggregateIp } from "./intel/aggregate";
import { recordCheck } from "./reputation";
import { queryHoneypot } from "./honeypot";
import { computeScore } from "../score";
import { buildVerdicts, headline } from "../verdicts";
import { dict } from "../i18n/config";
import type { IntelResult, ScoreInput } from "../types";

export interface AssessResult {
  ok: boolean;
  ip: string;
  private: boolean;
  ts: string;
  intel: IntelResult;
  score: {
    total: number | null;
    level: string;
    gate: string | null;
    coverage: string;
    note: string;
  } | null;
  headline: string | null;
  verdicts: { key: string; title: string; subtitle: string }[];
  honeypot: { known: boolean; hits: number } | null;
}

const COVERAGE_NOTE = {
  zh: "服务端可见维度评分(出口网络 35 + IP 信誉 15);浏览器维度(泄漏/一致性/环境/自动化)需在页面检测",
  en: "Score from server-visible dims only (network 35 + reputation 15); browser dims require the web UI",
  ja: "サーバー可視次元のみのスコア(ネットワーク 35 + 評判 15);ブラウザ次元はページ検査が必要",
};

export async function assessIp(rawIp: string, lang = "zh"): Promise<AssessResult> {
  const ip = rawIp.trim();
  const base: AssessResult = {
    ok: true, ip, private: false, ts: new Date().toISOString(),
    intel: {} as IntelResult, score: null, headline: null, verdicts: [], honeypot: null,
  };
  const intel = await aggregateIp(ip);
  base.intel = intel;
  if (intel.private) {
    base.private = true;
    return base;
  }
  const t = dict(lang);
  const input: ScoreInput = {
    domainExits: [],
    dbCountry: (intel.geo?.country_code as string) || undefined,
    risk: intel.risk
      ? {
          tor: !!intel.risk.is_tor,
          residentialProxy: !!intel.risk.is_residential_proxy,
          vpn: !!intel.risk.is_vpn,
          proxy: !!intel.risk.is_proxy,
          datacenter: !!intel.risk.is_datacenter,
          officialExit: (intel.risk.official_exit as string) || undefined,
        }
      : undefined,
    ipType: intel.network?.asn_type,
    abuse: intel.risk?.abuse_score,
    blacklist: intel.risk?.blacklist_score,
  };
  const score = computeScore(input);
  base.score = {
    total: score.score,
    level: score.level,
    gate: score.gate,
    coverage: `${score.coverage}/100`,
    note: COVERAGE_NOTE[lang as "zh" | "en" | "ja"] || COVERAGE_NOTE.zh,
  } as any;
  (base.score as any).dimensions = score.dimensions;
  base.headline = headline(score, t).text;
  base.verdicts = buildVerdicts(
    { score, intel, webrtc: { status: "idle", publicIps: [] }, env: null, auto: null, dns: null, history: null, directExitCount: 0, aiReachable: 0, aiTotal: 0 },
    t
  )
    .filter((c) => c.key === "identity" || c.key === "history")
    .map((c) => ({ key: c.key, title: c.title, subtitle: c.subtitle }));
  const hp = queryHoneypot(ip);
  base.honeypot = { known: hp.known, hits: hp.hits };
  recordCheck(ip, score.score, JSON.stringify({ v: 1, risk: intel.risk?.sources }));
  return base;
}
