// 自然语言判定:把六维评分+门控+情报折叠为 4 张用户可读的状态卡
// 文案基调:平实直陈,事实+影响,禁止拟人与俏皮比喻
import type { Dimension, IntelResult, ScoreResult, TraceProbe, WebRtcResult, DnsCheckLike } from "./types";
import type { EnvScanResult } from "./detect/environment";
import type { HistoryVerdict, EchoResult } from "./detect/direct";

export type Tone = "good" | "warn" | "bad" | "neutral";

export interface VerdictCardData {
  key: "identity" | "consistency" | "environment" | "history";
  tone: Tone;
  title: string; // 结论短语(≤16字)
  subtitle: string; // 一句话:意味着什么
  expandKey: "path" | "probes" | "env" | "record"; // 展开后显示的专业面板
}

export interface VerdictInput {
  score: ScoreResult;
  intel: IntelResult | null;
  claude?: TraceProbe;
  webrtc: WebRtcResult;
  env: EnvScanResult | null;
  auto: { webdriver: boolean; cookie: boolean; swiftShader: boolean } | null;
  dns: DnsCheckLike | null;
  history: HistoryVerdict | null;
  directExitCount: number;
  aiReachable: number;
  aiTotal: number;
}

function dim(s: ScoreResult, id: string): Dimension | undefined {
  return s.dimensions.find((d) => d.id === id);
}
const has = (s: ScoreResult, id: string, code: string) => dim(s, id)?.code === code;

export function buildVerdicts(input: VerdictInput, t: any): VerdictCardData[] {
  const { score: s, intel, claude, webrtc, env, auto, dns, history, aiReachable, aiTotal } = input;
  const V = t.verdicts;
  const cards: VerdictCardData[] = [];

  // ── 卡1 出口身份 ──
  let a: { tone: Tone; title: string; subtitle: string };
  const net = dim(s, "network");
  const native = intel?.network?.native;
  const nativeSuffix = native === true ? ` · ${V.nativeYes}` : native === false ? ` · ${V.nativeNo}` : "";
  if (s.gate === "unsupported") a = { tone: "bad", title: V.a.unsupported, subtitle: V.a.unsupportedSub.replace("{r}", s.region || "") };
  else if (s.gate === "unreachable") a = { tone: "bad", title: V.a.unreachable, subtitle: V.a.unreachableSub };
  else if (s.gate === "challenged") a = { tone: "bad", title: V.a.challenged, subtitle: V.a.challengedSub };
  else if (net?.code === "tor") a = { tone: "bad", title: V.a.tor, subtitle: V.a.torSub };
  else if (net?.code === "resproxy") a = { tone: "bad", title: V.a.resproxy, subtitle: V.a.resproxySub };
  else if (net?.code === "vpn") a = { tone: "warn", title: V.a.vpn + nativeSuffix, subtitle: V.a.vpnSub };
  else if (net?.code === "warp") a = { tone: "warn", title: V.a.warp + nativeSuffix, subtitle: V.a.warpSub };
  else if (net?.code === "datacenter") a = { tone: "warn", title: V.a.datacenter + nativeSuffix, subtitle: V.a.datacenterSub };
  else if (net?.code === "icloudRelay") a = { tone: "warn", title: V.a.icloud, subtitle: V.a.icloudSub };
  else if (net?.code === "business") a = { tone: "good", title: V.a.business + nativeSuffix, subtitle: V.a.businessSub };
  else if (net?.code === "residential") a = { tone: "good", title: V.a.residential + nativeSuffix, subtitle: V.a.residentialSub };
  else a = { tone: "neutral", title: V.a.unknown + nativeSuffix, subtitle: V.a.unknownSub };
  cards.push({ key: "identity", tone: a.tone, title: a.title, subtitle: a.subtitle, expandKey: "path" });

  // ── 卡2 出入一致 ──
  let b: { tone: Tone; title: string; subtitle: string };
  const cons = dim(s, "consistency");
  if (has(s, "exposure", "leakVsClaude")) b = { tone: "bad", title: V.b.leak, subtitle: V.b.leakSub };
  else if (dns?.polluted) b = { tone: "bad", title: V.b.dnsPolluted, subtitle: V.b.dnsPollutedSub };
  else if (cons?.code === "domainsSplit") b = { tone: "warn", title: V.b.split, subtitle: V.b.splitSub };
  else if (cons?.code === "familySplit") b = { tone: "warn", title: V.b.family, subtitle: V.b.familySub };
  else if (cons?.code === "coloMismatch") b = { tone: "warn", title: V.b.colo, subtitle: V.b.coloSub };
  else if (cons?.code === "geoDisagree") b = { tone: "warn", title: V.b.geo, subtitle: V.b.geoSub };
  else if (input.directExitCount > 1) b = { tone: "warn", title: V.b.multiExit, subtitle: V.b.multiExitSub };
  else if (cons?.frac !== null && cons?.frac !== undefined && cons.frac >= 0.9) b = { tone: "good", title: V.b.clean, subtitle: V.b.cleanSub };
  else b = { tone: "neutral", title: V.b.partial, subtitle: V.b.partialSub };
  cards.push({ key: "consistency", tone: b.tone, title: b.title, subtitle: b.subtitle, expandKey: "probes" });
  void claude; void webrtc;

  // ── 卡3 环境与自动化 ──
  let c: { tone: Tone; title: string; subtitle: string };
  const autoDim = dim(s, "automation");
  const brw = dim(s, "browser");
  if (autoDim?.code === "webdriver" || autoDim?.code === "swiftShader" || autoDim?.code === "platformSpoof") c = { tone: "bad", title: V.c.automation, subtitle: V.c.automationSub };
  else if (autoDim?.code === "cookieOff") c = { tone: "warn", title: V.c.cookie, subtitle: V.c.cookieSub };
  else if (brw?.code === "tzMismatch") c = { tone: "warn", title: V.c.tz, subtitle: V.c.tzSub };
  else if ((env?.score ?? 0) >= 61 && brw?.frac !== null && (brw?.frac ?? 1) < 0.5) c = { tone: "warn", title: V.c.cnHigh, subtitle: V.c.cnHighSub };
  else if (brw?.frac !== null && (brw?.frac ?? 1) >= 0.8 && autoDim?.frac === 1) c = { tone: "good", title: V.c.clean, subtitle: V.c.cleanSub };
  else c = { tone: "neutral", title: V.c.partial, subtitle: V.c.partialSub };
  cards.push({ key: "environment", tone: c.tone, title: c.title, subtitle: c.subtitle, expandKey: "env" });
  void auto; void dns;

  // ── 卡4 记录与历史 ──
  let d: { tone: Tone; title: string; subtitle: string };
  const rep = dim(s, "reputation");
  const nb = intel?.risk?.neighbors_flagged ?? 0;
  const pf = intel?.risk?.prefix_first_seen;
  const pfFresh = pf ? Date.now() - new Date(pf).getTime() < 90 * 86400_000 : false;
  const sw24 = history?.switches24h ?? 0;
  if (rep?.code === "flagged") d = { tone: "bad", title: V.d.flagged, subtitle: V.d.flaggedSub };
  else if (sw24 > 0) d = { tone: "bad", title: V.d.switched, subtitle: V.d.switchedSub };
  else if (nb > 0) d = { tone: "warn", title: V.d.neighbors, subtitle: V.d.neighborsSub };
  else if (pfFresh) d = { tone: "warn", title: V.d.freshPrefix, subtitle: V.d.freshPrefixSub };
  else if (aiTotal > 0 && aiReachable < Math.ceil(aiTotal / 2)) d = { tone: "warn", title: V.d.aiBlocked, subtitle: V.d.aiBlockedSub };
  else if (rep?.code === "clean" && sw24 === 0) d = { tone: "good", title: V.d.clean, subtitle: V.d.cleanSub };
  else d = { tone: "neutral", title: V.d.partial, subtitle: V.d.partialSub };
  cards.push({ key: "history", tone: d.tone, title: d.title, subtitle: d.subtitle, expandKey: "record" });
  return cards;
}

// 总评一句话
export function headline(s: ScoreResult, t: any): { tone: Tone; text: string } {
  const H = t.verdicts.headline;
  if (s.gate === "unsupported") return { tone: "bad", text: H.blocked.replace("{r}", s.region || "") };
  if (s.gate === "unreachable") return { tone: "bad", text: H.unreachable };
  if (s.gate === "challenged") return { tone: "bad", text: H.challenged };
  if (s.level === "low") return { tone: "good", text: H.low };
  if (s.level === "watch") return { tone: "warn", text: H.watch };
  if (s.level === "high") return { tone: "bad", text: H.high };
  return { tone: "bad", text: H.severe };
}
