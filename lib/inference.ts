// 推理引擎:从检测快照推导二阶结论(证据链 + 置信度)
// 输出为启发式推断,不是直接测量——卡片需注明
import type { IntelResult, TraceProbe, WebRtcResult, DnsCheckLike } from "./types";
import type { EnvScanResult } from "./detect/environment";
import type { EchoResult, HistoryVerdict } from "./detect/direct";
import type { StackInfo } from "./detect/dualstack";
import type { FingerprintResult } from "./detect/fingerprint";

export interface Conclusion {
  id: string;
  tone: "good" | "warn" | "bad" | "neutral";
  confidence: "high" | "medium" | "low";
  title: string;
  subtitle: string;
  evidence: string[];
}

export interface InferenceInput {
  probes: TraceProbe[];
  directExits: EchoResult[];
  dual: { v4: StackInfo | null; v6: StackInfo | null };
  webrtc: WebRtcResult;
  intel: IntelResult | null;
  env: EnvScanResult | null;
  dns: DnsCheckLike | null;
  fp: FingerprintResult | null;
  history: HistoryVerdict | null;
  claudeReachable: boolean | undefined;
}

const CN_TZ = ["Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "PRC"];

export function inferConclusions(input: InferenceInput, t: any): Conclusion[] {
  const out: Conclusion[] = [];
  const I = t.inference;
  const claude = input.probes.find((p) => p.host === "claude.ai");
  const claudeCountry = claude?.country || "";
  const tz = input.env?.detail?.timezone || "";
  const tzCN = CN_TZ.includes(tz);
  const cnEchoIps = input.directExits.filter((e) => e.kind === "cn").map((e) => e.ip);
  const cnEchoCountries = input.directExits.filter((e) => e.kind === "cn");
  const cnEchoSameAsClaude = cnEchoIps.length > 0 && claude?.ip && cnEchoIps.every((ip) => ip === claude.ip);
  const allExitsSame = input.directExits.length > 0 && new Set(input.directExits.map((e) => e.ip)).size === 1;
  const risk = input.intel?.risk || {};
  const network = input.intel?.network || {};
  const lies = input.fp?.lies || [];
  const lieKeys = new Set(lies.map((l) => l.key));

  // ── R1-R4: 用户真实位置与代理形态 ──
  if (tzCN && claudeCountry && claudeCountry !== "CN" && cnEchoSameAsClaude && allExitsSame) {
    out.push({
      id: "globalVpn", tone: "warn", confidence: "high",
      title: I.globalVpn.title, subtitle: I.globalVpn.sub,
      evidence: [`${I.ev.tz}: ${tz}`, `${I.ev.cnEcho}: ${input.directExits[0]?.ip} (${claudeCountry})`, `${I.ev.claudeExit}: ${claude?.ip} (${claudeCountry})`, I.ev.globalVpnNote],
    });
  } else if (tzCN && claudeCountry && claudeCountry !== "CN" && cnEchoIps.length > 0 && !cnEchoSameAsClaude) {
    out.push({
      id: "splitProxy", tone: "warn", confidence: "high",
      title: I.splitProxy.title, subtitle: I.splitProxy.sub,
      evidence: [`${I.ev.tz}: ${tz}`, `${I.ev.cnEcho}: ${cnEchoIps[0]}`, `${I.ev.claudeExit}: ${claude?.ip} (${claudeCountry})`, I.ev.splitNote],
    });
  } else if (tzCN && claudeCountry === "CN") {
    out.push({ id: "cnDirect", tone: "neutral", confidence: "high", title: I.cnDirect.title, subtitle: I.cnDirect.sub, evidence: [`${I.ev.tz}: ${tz}`, `${I.ev.claudeExit}: ${claude?.ip} (CN)`] });
  } else if (!tzCN && tz && claudeCountry && cnEchoIps.length > 0 && cnEchoSameAsClaude) {
    const tzMatches = input.intel?.geo?.timezone === tz;
    out.push({
      id: tzMatches ? "physicallyAbroad" : "tzDisguise",
      tone: tzMatches ? "good" : "warn",
      confidence: tzMatches ? "high" : "medium",
      title: tzMatches ? I.abroad.title : I.tzDisguise.title,
      subtitle: tzMatches ? I.abroad.sub : I.tzDisguise.sub,
      evidence: [`${I.ev.tz}: ${tz}`, `${I.ev.ipTz}: ${input.intel?.geo?.timezone || "?"}`, `${I.ev.claudeExit}: ${claude?.ip} (${claudeCountry})`],
    });
  }

  // ── R5: 明确的代理产品 ──
  if (claude && (claude.warp === "on" || claude.warp === "plus")) {
    out.push({ id: "warp", tone: "warn", confidence: "high", title: I.warp.title, subtitle: I.warp.sub, evidence: [`cdn-cgi/trace warp=${claude.warp}`, `${I.ev.colo}: ${claude.colo || "—"}`] });
  }
  const official = String(risk.official_exit || "");
  if (official === "mullvad") out.push({ id: "mullvad", tone: "warn", confidence: "high", title: I.mullvad.title, subtitle: I.mullvad.sub, evidence: [I.ev.orgMatch.replace("{v}", "Mullvad")] });
  if (official === "icloud_relay") out.push({ id: "icloud", tone: "neutral", confidence: "high", title: I.icloud.title, subtitle: I.icloud.sub, evidence: [I.ev.orgMatch.replace("{v}", "iCloud Private Relay")] });

  // ── R6: IPv6 裸奔 ──
  const v4c = input.dual.v4?.country || "";
  const v6c = input.dual.v6?.country || "";
  if (v4c && v6c && v4c !== v6c) {
    out.push({
      id: "v6Leak", tone: "bad", confidence: "high",
      title: v6c === "CN" ? I.v6LeakCn.title : I.v6Leak.title,
      subtitle: v6c === "CN" ? I.v6LeakCn.sub : I.v6Leak.sub,
      evidence: [`IPv4: ${input.dual.v4?.ip} (${v4c})`, `IPv6: ${input.dual.v6?.ip} (${v6c})`, I.ev.v6Note],
    });
  }

  // ── R7: 疑似 SNI 阻断 ──
  if (claude?.status === "failed" && claude.ms > 0 && claude.ms < 2500 && input.dns?.polluted === false && !input.history) {
    out.push({ id: "sniBlock", tone: "bad", confidence: "medium", title: I.sniBlock.title, subtitle: I.sniBlock.sub, evidence: [I.ev.fastFail.replace("{ms}", String(claude.ms)), I.ev.dnsOk, I.ev.checkOfficial] });
  }

  // ── R8: 代理池/新出口 ──
  const pf = risk.prefix_first_seen;
  const pfFresh = pf ? Date.now() - new Date(pf).getTime() < 90 * 86400_000 : false;
  const nb = risk.neighbors_flagged ?? 0;
  if (pfFresh && (nb > 0 || risk.is_datacenter || risk.is_proxy)) {
    out.push({
      id: "pool", tone: "bad", confidence: nb > 0 ? "high" : "medium",
      title: I.pool.title, subtitle: I.pool.sub,
      evidence: [`${I.ev.prefix}: ${String(pf).slice(0, 10)}`, nb > 0 ? `${I.ev.neighbors}: ${nb}/2` : "", risk.is_datacenter ? I.ev.dcFlag : ""].filter(Boolean),
    });
  }

  // ── R9: 反检测环境 ──
  const spoofLies = ["platformFonts", "emojiPlatform", "webglMismatch", "platformClaim", "tzSpoof", "langSpoof", "fontsChannel"].filter((k) => lieKeys.has(k)).length;
  if (spoofLies >= 2 && (risk.is_vpn || risk.is_proxy || risk.is_datacenter)) {
    out.push({ id: "antidetect", tone: "warn", confidence: "high", title: I.antidetect.title, subtitle: I.antidetect.sub, evidence: [I.ev.lies.replace("{n}", String(spoofLies)), ...(lies.slice(0, 3).map((l) => l.key))], });
  }

  // ── R10: 隐私加固工具 ──
  const hardened = input.fp?.unavailable.filter((u) => ["canvas", "fonts", "audio"].includes(u)) ?? [];
  const timingReduced = lieKeys.has("timingReduced");
  if (timingReduced || hardened.length >= 2) {
    out.push({ id: "hardened", tone: "neutral", confidence: "medium", title: I.hardened.title, subtitle: I.hardened.sub, evidence: [timingReduced ? I.ev.timing : "", hardened.length ? `${I.ev.blocked}: ${hardened.join(", ")}` : ""].filter(Boolean) });
  }

  // ── R11: 出口高频轮换 ──
  const sw7 = input.history?.switches7d ?? 0;
  if (sw7 >= 3) {
    out.push({ id: "rotation", tone: "bad", confidence: "high", title: I.rotation.title, subtitle: I.rotation.sub, evidence: [I.ev.sw7.replace("{n}", String(sw7)), `${I.ev.trail}: ${(input.history?.trail || []).join(" → ") || "—"}`] });
  }

  // ── R12: 最优家宽环境 ──
  if (network.asn_type === "residential" || network.asn_type === "mobile") {
    if (network.native === true && !pfFresh && (risk.abuse_score ?? 0) < 5 && (risk.blacklist_score ?? 0) < 5 && spoofLies === 0) {
      out.push({ id: "ideal", tone: "good", confidence: "high", title: I.ideal.title, subtitle: I.ideal.sub, evidence: [I.ev.residential, I.ev.native, I.ev.clean, I.ev.noLies] });
    }
  }
  return out;
}
