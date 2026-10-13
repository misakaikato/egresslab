// 推理引擎:从检测快照推导二阶结论(证据链 + 置信度)
// 输出为启发式推断,不是直接测量——卡片需注明
import type { IntelResult, TraceProbe, WebRtcResult, DnsCheckLike } from "./types";
import type { EnvScanResult } from "./detect/environment";
import type { EchoResult, HistoryVerdict } from "./detect/direct";
import type { StackInfo } from "./detect/dualstack";
import type { FingerprintResult } from "./detect/fingerprint";
import { coloToCountry } from "./colos";
import type { ScanRecord } from "./detect/scanHistory";
import type { DnsLeakResult } from "./detect/dnsleak";

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
  scans: ScanRecord[];
  claudeReachable: boolean | undefined;
  score?: import("./types").ScoreResult;
  dnsLeak?: DnsLeakResult;
}

const CN_TZ = ["Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "PRC"];
const CLOUD_RE = /amazon|aws|digitalocean|google cloud|gcp|\bazure\b|microsoft|vultr|linode|akamai|\bovh\b|hetzner|contabo|scaleway|oracle|alibaba|tencent|huawei cloud|bandwagon|hostwinds/i;
const PTR_PROXY_KEYWORDS = /vpn|proxy|relay|mullvad|nordvpn|surfshark|expressvpn|windscribe|tunnel|wg-|wireguard|shadowsocks|trojan|\bss\b|hysteria/i;
const APAC_COLOS = new Set(["HKG", "NRT", "KIX", "SIN", "ICN", "TPE", "SJC", "LAX", "SEA", "SYD"]);

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
  const spoofLies = ["platformFonts", "emojiPlatform", "webglMismatch", "platformClaim", "tzSpoof", "langSpoof"].filter((k) => lieKeys.has(k)).length;
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

  // ── R13-R16: 路径几何(colo/延迟/分流拓扑) ──
  const echoIps = Array.from(new Set(input.directExits.map((e) => e.ip)));
  const echoCountries = input.directExits.map((e) => e.ip);
  const claudeInEcho = !!claude?.ip && echoIps.includes(claude.ip);
  const probesWithIp = input.probes.filter((p) => p.ip);
  const exitCountries = Array.from(new Set(probesWithIp.map((p) => p.country).filter(Boolean)));
  const exitIps = Array.from(new Set(probesWithIp.map((p) => p.ip)));
  if (exitIps.length >= 2 && exitCountries.length >= 2) {
    out.push({ id: "domainSplitGeo", tone: "bad", confidence: "high", title: I.domainSplitGeo.title, subtitle: I.domainSplitGeo.sub, evidence: probesWithIp.map((p) => `${p.host}: ${p.ip} (${p.country})`) });
  }
  if (!claudeInEcho && echoIps.length === 1 && claude?.ip) {
    out.push({ id: "claudeOnlyExit", tone: "neutral", confidence: "high", title: I.claudeOnlyExit.title, subtitle: I.claudeOnlyExit.sub, evidence: [`${I.ev.claudeExit}: ${claude.ip}`, `${I.ev.echo}: ${echoIps[0]}`, I.ev.claudeOnlyNote] });
  }
  if (echoIps.length >= 2 && !claudeInEcho) {
    out.push({ id: "smartRouting", tone: "warn", confidence: "medium", title: I.smartRouting.title, subtitle: I.smartRouting.sub, evidence: input.directExits.map((e) => `${e.via}: ${e.ip}`) });
  }
  const coloCountry = claude?.colo ? coloToCountry(claude.colo) : null;
  const ipCountry = claudeCountry || (input.intel?.geo?.country_code as string) || "";
  if (coloCountry && ipCountry && coloCountry !== ipCountry) {
    const apac = APAC_COLOS.has(claude!.colo!);
    out.push({
      id: "coloMismatch", tone: apac && tzCN ? "warn" : "neutral", confidence: apac && tzCN ? "high" : "medium",
      title: tzCN && apac ? I.relayApac.title : I.coloMismatch.title,
      subtitle: tzCN && apac ? I.relayApac.sub : I.coloMismatch.sub,
      evidence: [`${I.ev.colo}: ${claude!.colo} (${coloCountry})`, `${I.ev.regGeo}: ${ipCountry}`, I.ev.coloNote],
    });
  }
  if (tzCN && claudeCountry && claudeCountry !== "CN" && claude && claude.ms > 0 && claude.ms < 90) {
    out.push({ id: "fastPath", tone: "neutral", confidence: "medium", title: I.fastPath.title, subtitle: I.fastPath.sub, evidence: [`${I.ev.latency}: ${claude.ms}ms`, `${I.ev.claudeExit}: ${claude.ip} (${claudeCountry})`, I.ev.fastNote] });
  }
  if (claude && claude.ms > 1200 && claude.status === "ok") {
    out.push({ id: "longChain", tone: "warn", confidence: "medium", title: I.longChain.title, subtitle: I.longChain.sub, evidence: [`${I.ev.latency}: ${claude.ms}ms`, I.ev.chainNote] });
  }
  if (claude && claude.status === "ok" && claude.fallback && claude.ip === "") {
    out.push({ id: "traceBlocked", tone: "warn", confidence: "medium", title: I.traceBlocked.title, subtitle: I.traceBlocked.sub, evidence: [I.ev.fallbackOk, I.ev.traceBlockedNote] });
  }
  const apiProbe = input.probes.find((p) => p.host === "api.anthropic.com");
  if (apiProbe?.challenged && !claude?.challenged) {
    out.push({ id: "apiOnlyChallenge", tone: "bad", confidence: "high", title: I.apiOnlyChallenge.title, subtitle: I.apiOnlyChallenge.sub, evidence: ["api.anthropic.com: 403", "claude.ai: OK", I.ev.apiChallengeNote] });
  }

  // ── R17-R19: WebRTC / DNS ──
  if ((input.webrtc.status === "timeout" || input.webrtc.status === "unsupported") && input.webrtc.publicIps.length === 0) {
    out.push({ id: "webrtcOff", tone: "good", confidence: "medium", title: I.webrtcOff.title, subtitle: I.webrtcOff.sub, evidence: [I.ev.webrtcNoCandidate] });
  }
  const dnsProviders = input.dns?.providers || [];
  if (input.dns?.status === "partial") {
    out.push({ id: "dohSplit", tone: "warn", confidence: "medium", title: I.dohSplit.title, subtitle: I.dohSplit.sub, evidence: [`${I.ev.dohReachable}: ${dnsProviders.join(", ")}`, I.ev.dohNote] });
  }
  if (input.dns?.polluted === true) {
    out.push({ id: "dnsMitm", tone: "bad", confidence: "high", title: I.dnsMitm.title, subtitle: I.dnsMitm.sub, evidence: [`${I.ev.outOfRange}: ${(input.dns.outOfRange || []).slice(0, 2).join("; ")}`, I.ev.dnsMitmNote] });
  }

  // ── R20-R22: ISP/PTR/家宽征用 ──
  const orgBlob = `${network.isp || ""} ${network.asn_name || ""}`.toLowerCase();
  if (CLOUD_RE.test(orgBlob)) {
    out.push({ id: "cloudExit", tone: "warn", confidence: "high", title: I.cloudExit.title, subtitle: I.cloudExit.sub, evidence: [`${I.ev.org}: ${network.isp || network.asn_name}`, I.ev.cloudNote] });
  }
  const ptrHost = (network as any).ptr?.host || "";
  if (ptrHost && PTR_PROXY_KEYWORDS.test(ptrHost)) {
    const kw = PTR_PROXY_KEYWORDS.exec(ptrHost)?.[0];
    out.push({ id: "ptrProxy", tone: "warn", confidence: "medium", title: I.ptrProxy.title, subtitle: I.ptrProxy.sub, evidence: [`PTR: ${ptrHost}`, I.ev.ptrNote.replace("{kw}", kw || "proxy")] });
  }
  if ((network.asn_type === "residential" || network.asn_type === "mobile") && ((risk.abuse_score ?? 0) >= 30 || (risk.blacklist_score ?? 0) >= 50)) {
    out.push({ id: "hijackedHome", tone: "bad", confidence: "medium", title: I.hijackedHome.title, subtitle: I.hijackedHome.sub, evidence: [I.ev.residential, `abuse ${risk.abuse_score}/blacklist ${risk.blacklist_score}`, I.ev.hijackNote] });
  }

  // ── R23-R27: 历史时序与指纹稳定性 ──
  const scans = input.scans || [];
  const withFp = scans.filter((sc) => sc.fpHash);
  if (withFp.length >= 2) {
    const stable = withFp[withFp.length - 1].fpHash === withFp[withFp.length - 2].fpHash;
    const exitsRotate = (input.history?.switches7d ?? 0) >= 2;
    if (!stable && exitsRotate) {
      out.push({ id: "fpRotating", tone: "bad", confidence: "high", title: I.fpRotating.title, subtitle: I.fpRotating.sub, evidence: [I.ev.fpChanged, `${I.ev.sw7.replace("{n}", String(input.history?.switches7d ?? 0))}`, I.ev.fpRotateNote] });
    } else if (!stable) {
      out.push({ id: "fpDrift", tone: "warn", confidence: "medium", title: I.fpDrift.title, subtitle: I.fpDrift.sub, evidence: [I.ev.fpChanged, I.ev.fpDriftNote] });
    } else if (exitsRotate && stable) {
      out.push({ id: "fpStableExitRotate", tone: "warn", confidence: "medium", title: I.fpStableExitRotate.title, subtitle: I.fpStableExitRotate.sub, evidence: [I.ev.fpStable, `${I.ev.sw7.replace("{n}", String(input.history?.switches7d ?? 0))}`, I.ev.stableRotateNote] });
    }
  }
  if (scans.length >= 4) {
    const last4 = scans.slice(-4).map((x) => x.score);
    const rising = last4[3] > last4[0] + 10;
    const falling = last4[3] < last4[0] - 10;
    if (rising || falling) {
      out.push({ id: "trend", tone: rising ? "good" : "bad", confidence: "medium", title: rising ? I.trendUp.title : I.trendDown.title, subtitle: rising ? I.trendUp.sub : I.trendDown.sub, evidence: [`${I.ev.scores}: ${last4.join(" → ")}`] });
    }
  }
  const hist = input.history?.entries || [];
  if (hist.length >= 3) {
    const span48h = hist.filter((h) => Date.now() - h.ts <= 48 * 3600_000);
    const ips48 = new Set(span48h.map((h) => h.ip));
    if (ips48.size === 1 && span48h.length >= 3) {
      out.push({ id: "stickyExit", tone: "good", confidence: "medium", title: I.stickyExit.title, subtitle: I.stickyExit.sub, evidence: [`${I.ev.sameExit48}: ${span48h[0].ip}`, I.ev.stickyNote] });
    }
  }
  if (hist.length >= 2) {
    const a = hist[hist.length - 2], b = hist[hist.length - 1];
    if (a.ip !== b.ip && a.country === b.country) {
      out.push({ id: "redial", tone: "neutral", confidence: "medium", title: I.redial.title, subtitle: I.redial.sub, evidence: [`${a.ip} → ${b.ip} (${b.country})`, I.ev.redialNote] });
    }
  }

  // ── R28-R29: 设备画像 ──
  const touch = (input.fp?.components.find((c) => c.key === "hardware")?.value || "").includes("t") ? null : null; // 占位:触摸信息在 env/UA
  const uaMobile = typeof navigator !== "undefined" && /android|iphone|ipad|mobile/i.test(navigator.userAgent);
  if (uaMobile && (network.asn_type === "mobile" || /mobile|cellular|wireless/i.test(orgBlob))) {
    out.push({ id: "mobileEnv", tone: "good", confidence: "medium", title: I.mobileEnv.title, subtitle: I.mobileEnv.sub, evidence: [I.ev.uaMobile, `${I.ev.org}: ${network.isp || network.asn_name}`] });
  }
  void touch;
  const entropy = input.fp?.entropyBits ?? 0;
  const autoSigns = (input.fp?.lies.filter((l) => ["platformFonts", "webglMismatch"].includes(l.key)).length ?? 0) + (input.fp?.unavailable.length ?? 0);
  if (entropy > 0 && entropy < 25 && autoSigns >= 3) {
    out.push({ id: "headlessFarm", tone: "bad", confidence: "medium", title: I.headlessFarm.title, subtitle: I.headlessFarm.sub, evidence: [`${I.ev.entropy}: ${entropy}b`, `${I.ev.unavailable}: ${(input.fp?.unavailable || []).join(", ")}`] });
  }

  // ── R30: 跨层自洽度(元结论) ──
  const contradictions: string[] = [];
  if (tzCN && ipCountry && ipCountry !== "CN" && !cnEchoSameAsClaude) contradictions.push(I.coherence.items.tzGeo);
  if (spoofLies > 0) contradictions.push(I.coherence.items.spoof.replace("{n}", String(spoofLies)));
  if (input.dns?.polluted) contradictions.push(I.coherence.items.dns);
  if (exitIps.length >= 2) contradictions.push(I.coherence.items.domainSplit);
  if (v4c && v6c && v4c !== v6c) contradictions.push(I.coherence.items.family);
  if (echoIps.length >= 2) contradictions.push(I.coherence.items.multiExit);
  if (coloCountry && ipCountry && coloCountry !== ipCountry) contradictions.push(I.coherence.items.colo);
  const layers = 7;
  const ok = layers - contradictions.length;
  out.push({
    id: "coherence", tone: contradictions.length === 0 ? "good" : contradictions.length <= 2 ? "warn" : "bad",
    confidence: contradictions.length === 0 ? "high" : "medium",
    title: I.coherence.title.replace("{ok}", String(ok)).replace("{n}", String(layers)),
    subtitle: contradictions.length === 0 ? I.coherence.subOk : I.coherence.subBad,
    evidence: contradictions.length ? contradictions : [I.coherence.allOk],
  });

  // ── R31-R39: 第四批规则 ──
  const score = input.score;
  const langs = (input.env?.detail?.languages || "").toLowerCase();
  const noZhLang = langs && !langs.split(",").some((l) => l.trim().startsWith("zh"));
  if (tzCN && noZhLang) {
    out.push({ id: "patchworkEnv", tone: "warn", confidence: "medium", title: I.patchworkEnv.title, subtitle: I.patchworkEnv.sub, evidence: [`${I.ev.tz}: ${tz}`, `${I.ev.lang}: ${langs.split(",")[0]}`, I.ev.patchNote] });
  }
  const repCheckCount = (input.intel as any)?._repCount;
  if ((network.native === true || ipCountry) && (risk.neighbors_flagged ?? 0) === 0 && !pfFresh && (risk.abuse_score ?? 0) < 5 && (risk.blacklist_score ?? 0) < 5 && (network.asn_type === "residential" || network.asn_type === "mobile" || risk.is_datacenter)) {
    out.push({ id: (network.asn_type === "residential" || network.asn_type === "mobile") ? "lowShare" : "selfHostedRelay", tone: "good", confidence: "medium", title: (network.asn_type === "residential" || network.asn_type === "mobile") ? I.lowShare.title : I.selfHosted.title, subtitle: (network.asn_type === "residential" || network.asn_type === "mobile") ? I.lowShare.sub : I.selfHosted.sub, evidence: [I.ev.neighbors0, I.ev.clean, network.native === true ? I.ev.native : I.ev.oldPrefix] });
  }
  if (claude?.challenged && (risk.blacklist_score ?? 0) < 5 && (risk.abuse_score ?? 0) < 5) {
    out.push({ id: "asnCollateral", tone: "warn", confidence: "medium", title: I.asnCollateral.title, subtitle: I.asnCollateral.sub, evidence: [I.ev.clean, "cdn-cgi/trace 403", I.ev.asnCollateralNote] });
  }
  if (score) {
    const expo = score.dimensions.find((d) => d.id === "exposure");
    if (expo?.code === "leakVsClaude" && (risk.is_vpn || risk.is_proxy)) {
      out.push({ id: "webrtcProxyGap", tone: "bad", confidence: "high", title: I.webrtcProxyGap.title, subtitle: I.webrtcProxyGap.sub, evidence: [I.ev.webrtcLeak, I.ev.proxyOn, I.ev.webrtcFix] });
    }
  }
  const incognito = input.fp?.components.find((c) => c.key === "incognito")?.value;
  if (incognito === "reduced") {
    out.push({ id: "incognitoMyth", tone: "neutral", confidence: "high", title: I.incognitoMyth.title, subtitle: I.incognitoMyth.sub, evidence: [I.ev.incognitoNote] });
  }
  if (input.dns?.status === "failed" && claude?.status === "ok") {
    out.push({ id: "dohAllFail", tone: "neutral", confidence: "medium", title: I.dohAllFail.title, subtitle: I.dohAllFail.sub, evidence: ["DoH: dns.google + cloudflare-dns.com 均失败", `${I.ev.claudeExit}: OK`, I.ev.dohAllNote] });
  }
  const fontsComp = input.fp?.components.find((c) => c.key === "fonts")?.value || "";
  const fontsN = Number(fontsComp.split("/")[0]);
  if (fontsN > 0 && fontsN < 16) {
    out.push({ id: "sparseFonts", tone: "neutral", confidence: "low", title: I.sparseFonts.title, subtitle: I.sparseFonts.sub, evidence: [`${I.ev.fontsCount}: ${fontsComp}`, I.ev.sparseNote] });
  }
  if (score) {
    const badConds = score.gate === "unsupported" || score.gate === "challenged" || (risk.is_datacenter && (input.env?.score ?? 0) >= 31);
    const goodConds = !score.gate && score.score >= 80 && (network.asn_type === "residential" || network.asn_type === "mobile");
    if (badConds) out.push({ id: "registerNo", tone: "bad", confidence: "high", title: I.registerNo.title, subtitle: I.registerNo.sub, evidence: [score.gate ? I.ev.gateOn : I.ev.dcEnv, `${I.ev.cnScore}: ${input.env?.score ?? "—"}`] });
    else if (goodConds) out.push({ id: "registerOk", tone: "good", confidence: "high", title: I.registerOk.title, subtitle: I.registerOk.sub, evidence: [`${I.ev.score}: ${score.score}`, I.ev.residential, I.ev.noLies] });
  }

  // ── 真 DNS 泄漏(dnsleak-server 部署后启用) ──
  if (input.dnsLeak?.available && input.dnsLeak.resolvers.length && input.dnsLeak.mismatch) {
    const cnResolver = input.dnsLeak.resolvers.some((r) => r.country === "CN");
    out.push({
      id: cnResolver ? "dnsLeakCn" : "dnsLeakForeign",
      tone: "bad", confidence: "high",
      title: cnResolver ? I.dnsLeakCn.title : I.dnsLeakForeign.title,
      subtitle: cnResolver ? I.dnsLeakCn.sub : I.dnsLeakForeign.sub,
      evidence: [
        ...input.dnsLeak.resolvers.slice(0, 3).map((r) => `${I.ev.resolver} ${r.ip} (${r.country || "?"})`),
        `${I.ev.claudeExit}: ${input.dnsLeak.exitCountry || "?"}`,
      ],
    });
  }

  // ── R12: 最优家宽环境 ──
  if (network.asn_type === "residential" || network.asn_type === "mobile") {
    if (network.native === true && !pfFresh && (risk.abuse_score ?? 0) < 5 && (risk.blacklist_score ?? 0) < 5 && spoofLies === 0) {
      out.push({ id: "ideal", tone: "good", confidence: "high", title: I.ideal.title, subtitle: I.ideal.sub, evidence: [I.ev.residential, I.ev.native, I.ev.clean, I.ev.noLies] });
    }
  }
  return out;
}
