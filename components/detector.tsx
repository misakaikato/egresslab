"use client";
// 检测编排器:点击开始 → 并行探测 → 聚合 → 评分 → 渲染
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dict } from "@/lib/i18n/config";
import { computeScore } from "@/lib/score";
import type { IntelResult, ScoreInput, TraceProbe, WebRtcResult } from "@/lib/types";
import { probeTrace, ANTHROPIC_HOSTS } from "@/lib/detect/trace";
import { probeDirect, distinctExits, recordExit, type HistoryVerdict, type EchoResult } from "@/lib/detect/direct";
import { probeAiPack } from "@/lib/detect/aipack";
import { collectFingerprint, type FingerprintResult } from "@/lib/detect/fingerprint";
import { loadScans, saveScan, type ScanRecord } from "@/lib/detect/scanHistory";
import { probeDualStack, StackInfo } from "@/lib/detect/dualstack";
import { detectWebRtc } from "@/lib/detect/webrtc";
import { scanEnvironment, EnvScanResult } from "@/lib/detect/environment";
import { collectAutomation } from "@/lib/detect/automation";
import { checkDns, type DnsCheck } from "@/lib/detect/dns";
import { runDnsLeak, type DnsLeakResult } from "@/lib/detect/dnsleak";
import { coloToCountry } from "@/lib/colos";
import ScoreDial from "./ScoreDial";
import DimensionBars from "./DimensionBars";
import ProbeTable from "./ProbeTable";
import PathPanel from "./PathPanel";
import EnvironmentPanel from "./EnvironmentPanel";
import ReputationPanel, { RepData } from "./ReputationPanel";
import ChainCard from "./ChainCard";
import HistoryCard from "./HistoryCard";
import InferenceCard from "./InferenceCard";
import AdviceCard from "./AdviceCard";
import { buildAdvice } from "@/lib/advice";
import AccountCard from "./AccountCard";
import TurnstileCard from "./TurnstileCard";
import SpeedCard from "./SpeedCard";
import HeadersCard from "./HeadersCard";
import { inferConclusions } from "@/lib/inference";
import FingerprintPanel from "./FingerprintPanel";
import { buildVerdicts, headline, type Tone } from "@/lib/verdicts";
import { HeadlineBand, VerdictCard } from "./VerdictCard";
import { Play, RotateCw, TerminalSquare, Copy, Check, Activity, Map, Radar, Fingerprint, Server, ChevronDown } from "lucide-react";

type Phase = "idle" | "running" | "done";
interface AutoInfo { webdriver: boolean; cookie: boolean; webglRenderer: string; swiftShader: boolean }

export default function Detector({ locale }: { locale: string }) {
  const t = useMemo(() => dict(locale), [locale]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepBits, setStepBits] = useState(0); // 位图:bit0=出口路径 bit1=IP情报 bit2=连通性 bit3=泄漏与环境
  const [probes, setProbes] = useState<TraceProbe[]>([]);
  const [direct, setDirect] = useState<{ ip: string; via: string; exits: EchoResult[] }>({ ip: "", via: "", exits: [] });
  const [history, setHistory] = useState<HistoryVerdict | null>(null);
  const [aiPack, setAiPack] = useState<TraceProbe[] | null>(null);
  const [fp, setFp] = useState<FingerprintResult | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [dual, setDual] = useState<{ v4: StackInfo | null; v6: StackInfo | null }>({ v4: null, v6: null });
  const [intel, setIntel] = useState<IntelResult | null>(null);
  const [intelFailed, setIntelFailed] = useState(false);
  const [webrtc, setWebrtc] = useState<WebRtcResult>({ status: "idle", publicIps: [] });
  const [env, setEnv] = useState<EnvScanResult | null>(null);
  const [auto, setAuto] = useState<AutoInfo | null>(null);
  const [dnsCheck, setDns] = useState<DnsCheck | null>(null);
  const [dnsLeak, setDnsLeak] = useState<DnsLeakResult | null>(null);
  const [copiedFmt, setCopiedFmt] = useState<"md" | "json" | null>(null);
  const [cfg, setCfg] = useState<{ turnstile: string | null; recaptcha: string | null } | null>(null);
  const [mode, setMode] = useState<"simple" | "pro">("simple");
  useEffect(() => {
    try { const v = localStorage.getItem("exitlens:view") ?? localStorage.getItem("egresslab:view"); if (v === "pro" || v === "simple") setMode(v); } catch {}
  }, []);
  const switchMode = (m: "simple" | "pro") => { setMode(m); try { localStorage.setItem("exitlens:view", m); } catch {} };
  useEffect(() => {
    if (phase !== "running") return;
    const iv = setInterval(() => setElapsed((e) => e + 0.25), 250);
    return () => clearInterval(iv);
  }, [phase]);
  const [rep, setRep] = useState<RepData | null>(null);
  const [status, setStatus] = useState<{ indicator: string; description: string; components: { name: string; status: string }[]; fetched_at: string } | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" }).then((r) => r.json()).then((j) => setCfg({ turnstile: j?.turnstile || null, recaptcha: j?.recaptcha || null })).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/claude/status").then((r) => r.json()).then((j) => { if (j?.ok) setStatus({ indicator: j.indicator, description: j.description, components: j.components || [], fetched_at: j.fetched_at }); }).catch(() => {});
  }, []);

  useEffect(() => {
    setScans(loadScans());
  }, []);

  const run = useCallback(async () => {
    setPhase("running");
    setStepBits(0);
    setElapsed(0);
    setProbes([]);
    setIntel(null);
    setIntelFailed(false);
    setEnv(null);
    setAuto(null);
    setRep(null);
    setFp(null);
    setWebrtc({ status: "checking", publicIps: [] });
    const hostList = [...ANTHROPIC_HOSTS];
    setProbes(hostList.map((h) => ({ host: h, status: "pending", ip: "", country: "", warp: "", colo: "", ms: 0, fallback: false, httpStatus: 0, challenged: false })));

    // ── 全并行:t=0 同时启动所有独立任务 ──
    const tracePs = hostList.map((h) => probeTrace(h));
    const directP = probeDirect();
    const dualP = probeDualStack();
    const webrtcP = detectWebRtc();
    const envP = scanEnvironment();
    const dnsP = checkDns();
    const aiP = probeAiPack();
    const fpP = collectFingerprint().catch(() => null);

    // 情报早触发:claude.ai trace 或 直连回显 先到先用
    const ipReadyP = Promise.race([
      tracePs[0].then((p) => p.ip || "").catch(() => ""),
      directP.then((d) => d.ip || "").catch(() => ""),
    ]);
    const intelP = ipReadyP.then(async (targetIp) => {
      if (!targetIp) return null;
      try {
        const res = await fetch(`/api/ip/${encodeURIComponent(targetIp)}`);
        const j = await res.json();
        if (j?.ok) {
          setIntel(j);
          setStepBits((b) => b | 0b10);
          return j;
        }
      } catch {}
      setIntelFailed(true);
      return null;
    });

    // 出口路径组
    const [traceList, directR, dualR] = await Promise.all([Promise.all(tracePs), directP, dualP]);
    setProbes(traceList);
    setDirect(directR);
    setDual(dualR);
    setStepBits((b) => b | 0b1);

    // 真 DNS 泄漏(与情报/泄漏组并行,依赖出口国家)
    const dnsLeakP = runDnsLeak(traceList[0]?.country || "").catch(() => null);

    // 泄漏与环境组
    const [webrtcR, envR, dnsR, aiR, fpR] = await Promise.all([webrtcP, envP, dnsP, aiP, fpP]);
    setWebrtc(webrtcR);
    setEnv(envR);
    setDns(dnsR);
    setAiPack(aiR);
    setFp(fpR);
    setAuto(collectAutomation());
    setStepBits((b) => b | 0b1000);
    // 连通性组(claude 可达性 + AI 包)
    setStepBits((b) => b | 0b100);

    await intelP;
    setDnsLeak(await dnsLeakP);
    const exitIpForHist = traceList[0]?.ip || directR.ip;
    const exitCountry = traceList[0]?.country || "";
    if (exitIpForHist) setHistory(recordExit(exitIpForHist, String(exitCountry || "").toUpperCase()));
    const repIp = exitIpForHist;
    if (repIp) {
      try {
        const rj = await fetch(`/api/reputation?ip=${encodeURIComponent(repIp)}`).then((r) => r.json());
        setRep(rj);
      } catch {}
    }
    setStepBits(0b1111);
    setPhase("done");
  }, []);

  const claude = probes.find((p) => p.host === "claude.ai");
  const scoreInput: ScoreInput = useMemo(() => ({
    claudeIp: claude?.ip || undefined,
    claudeReachable: probes.length ? claude?.status !== "failed" : undefined,
    cfCountry: claude?.country || undefined,
    dbCountry: (intel?.geo?.country_code as string) || undefined,
    warp: claude?.warp,
    domainExits: probes.filter((p) => p.ip).map((p) => ({ host: p.host, ip: p.ip, country: p.country })),
    v4Country: dual.v4?.country || undefined,
    v6Country: dual.v6?.country || undefined,
    risk: intel?.risk ? {
      tor: !!intel.risk.is_tor, residentialProxy: !!intel.risk.is_residential_proxy,
      vpn: !!intel.risk.is_vpn, proxy: !!intel.risk.is_proxy,
      datacenter: !!intel.risk.is_datacenter, officialExit: intel.risk.official_exit || undefined,
    } : undefined,
    ipType: intel?.network?.asn_type,
    abuse: intel?.risk?.abuse_score,
    blacklist: intel?.risk?.blacklist_score,
    webrtc: webrtc.status === "idle" || webrtc.status === "checking" ? undefined : { publicIps: webrtc.publicIps, siteStatus: webrtc.status },
    browserTimezone: env?.detail.timezone,
    ipTimezone: (intel?.geo?.timezone as string) || undefined,
    cnScore: env?.score,
    webdriver: auto?.webdriver,
    cookieEnabled: auto?.cookie,
    swiftShader: auto?.swiftShader,
    platformContradiction: env?.platformSpoof?.fontContradiction,
    coloCountry: claude?.colo ? coloToCountry(claude.colo) || undefined : undefined,
    challenged: probes.length ? probes.some((p) => p.host === "claude.ai" && p.challenged) : undefined,
  }), [probes, claude, intel, dual, webrtc, env, auto]);
  const score = useMemo(() => (phase === "done" ? computeScore(scoreInput) : null), [phase, scoreInput]);
  const vCards = useMemo(
    () =>
      score
        ? buildVerdicts(
            { score, intel, claude, webrtc, env, auto, dns: dnsCheck, history, directExitCount: distinctExits(direct.exits).length, aiReachable: aiPack ? aiPack.filter((x) => x.status === "ok").length : 0, aiTotal: aiPack ? aiPack.length : 0 },
            t
          )
        : null,
    [score, intel, claude, webrtc, env, auto, dnsCheck, history, direct, aiPack, t]
  );
  const head = useMemo(() => (score ? headline(score, t) : null), [score, t]);
  const conclusions = useMemo(
    () =>
      phase === "done"
        ? inferConclusions(
            { probes, directExits: direct.exits, dual, webrtc, intel, env, dns: dnsCheck, fp, history, scans, claudeReachable: probes.length ? claude?.status !== "failed" : undefined, dnsLeak: dnsLeak || undefined },
            t
          )
        : [],
    [phase, probes, direct, dual, webrtc, intel, env, dnsCheck, fp, history, scans, claude, t, dnsLeak]
  );
  const advices = useMemo(
    () => (phase === "done" && score ? buildAdvice({ probes, directExits: direct.exits, dual, webrtc, intel, env, dns: dnsCheck, fp, history, scans, claudeReachable: probes.length ? claude?.status !== "failed" : undefined, dnsLeak: dnsLeak || undefined }, score, conclusions, t) : []),
    [phase, score, conclusions, probes, direct, dual, webrtc, intel, env, dnsCheck, fp, history, scans, claude, t]
  );

  const savedAt = useRef(0);
  useEffect(() => {
    if (phase !== "done" || !score || !head || !vCards) return;
    if (Date.now() - savedAt.current < 3000) return;
    savedAt.current = Date.now();
    const rec: ScanRecord = {
      ts: Date.now(),
      score: score.score,
      level: score.level,
      gate: score.gate,
      region: score.region,
      exitIp: claude?.ip || direct.ip,
      headline: head.text,
      verdicts: vCards.map((c) => c.title),
      cnScore: env?.score,
      fpHash: fp?.hash,
    };
    setScans(saveScan(rec));
  }, [phase, score, head, vCards]);

  const exportReport = async (fmt: "md" | "json") => {
    if (!score) return;
    const snap = {
      tool: "ExitLens",
      ts: new Date().toISOString(),
      score: { total: score.score, level: score.level, coverage: score.coverage, gate: score.gate, region: score.region },
      headline: head?.text,
      dimensions: score.dimensions.map((d) => ({ id: d.id, weight: d.weight, points: d.points, frac: d.frac, code: d.code })),
      verdicts: vCards?.map((c) => ({ key: c.key, title: c.title, subtitle: c.subtitle, tone: c.tone })) ?? [],
      conclusions: conclusions.map((c) => ({ id: c.id, title: c.title, subtitle: c.subtitle, confidence: c.confidence, evidence: c.evidence })),
      advice: advices.map((a) => ({ tone: a.tone, title: a.title, detail: a.detail })),
      probes: probes.map((p) => ({ host: p.host, status: p.status, ip: p.ip, country: p.country, warp: p.warp, colo: p.colo, ms: p.ms, challenged: p.challenged })),
      exits: { claude: claude?.ip || null, direct: direct.exits.map((e) => `${e.ip}(${e.kind})`), v4: dual.v4 || null, v6: dual.v6 || null },
      intel: intel ? { geo: intel.geo, network: intel.network, risk: intel.risk, meta: intel.meta } : null,
      dns: dnsCheck,
      dnsLeak: dnsLeak?.available ? { resolvers: dnsLeak.resolvers, mismatch: dnsLeak.mismatch } : null,
      webrtc: { status: webrtc.status, ips: webrtc.publicIps },
      env: env ? { score: env.score, level: env.level, signals: env.items.map((i) => ({ k: i.key, score: i.score, value: i.value })), platformSpoof: env.platformSpoof } : null,
      fingerprint: fp ? { hash: fp.hash, entropyBits: fp.entropyBits, components: fp.components, lies: fp.lies, unavailable: fp.unavailable } : null,
      automation: auto,
      history: history ? { switches24h: history.switches24h, switches7d: history.switches7d, trail: history.trail } : null,
      reputation: rep,
      aiPack: aiPack ? aiPack.map((p) => ({ host: p.host, ok: p.status === "ok", ms: p.ms, ip: p.ip, colo: p.colo })) : null,
    };
    let text: string;
    if (fmt === "json") {
      text = JSON.stringify(snap, null, 2);
    } else {
      const L: string[] = [];
      L.push(`# ExitLens 报告 · ${snap.ts}`);
      L.push(`\n**评分 ${score.score}/100 · ${score.level}${score.gate ? ` · gate: ${score.gate}` : ""} · 出口地区 ${score.region || "—"}**\n`);
      L.push(`| 维度 | 得分 | 判定 |\n|---|---|---|`);
      for (const d of snap.dimensions) L.push(`| ${d.id} | ${d.frac === null ? "N/A" : `${d.points}/${d.weight}`} | ${d.code} |`);
      if (snap.verdicts.length) { L.push(`\n## 状态`); for (const v of snap.verdicts) L.push(`- ${v.title} — ${v.subtitle}`); }
      if (snap.conclusions.length) { L.push(`\n## 深度研判`); for (const c of snap.conclusions) L.push(`- [${c.confidence}] ${c.title} — ${c.subtitle}`); }
      if (snap.advice.length) { L.push(`\n## 处置建议`); for (const a of snap.advice) L.push(`- (${a.tone}) ${a.title}${a.detail ? ` — ${a.detail}` : ""}`); }
      L.push(`\n## 探测`); for (const p of snap.probes) L.push(`- ${p.host}: ${p.status}${p.ip ? ` ${p.ip} (${p.country})${p.warp === "on" ? " WARP" : ""}${p.ms ? ` ${p.ms}ms` : ""}${p.challenged ? " ⚠challenged" : ""}` : ""}`);
      L.push(`\n## 出口\n- Claude: ${snap.exits.claude || "—"}\n- 直连: ${snap.exits.direct.join(", ") || "—"}\n- v4/v6: ${snap.exits.v4?.ip || "—"} / ${snap.exits.v6?.ip || "—"}`);
      if (snap.intel?.risk) L.push(`\n## IP 情报\n- 类型: ${snap.intel.network?.asn_type} · ASN ${snap.intel.network?.asn} ${snap.intel.network?.asn_name}\n- 风险: VPN=${snap.intel.risk.is_vpn} 代理=${snap.intel.risk.is_proxy} 机房=${snap.intel.risk.is_datacenter} Tor=${snap.intel.risk.is_tor}\n- abuse=${snap.intel.risk.abuse_score} blacklist=${snap.intel.risk.blacklist_score} 前缀=${snap.intel.risk.prefix_first_seen || "—"}`);
      if (snap.dnsLeak?.resolvers?.length) L.push(`\n## 真 DNS\n${snap.dnsLeak.resolvers.map((r) => `- ${r.ip} (${r.country})`).join("\n")}${snap.dnsLeak.mismatch ? "\n⚠ 与出口不同国" : ""}`);
      if (snap.env) L.push(`\n## 环境\n- 大陆特征 ${snap.env.score}/100 (${snap.env.level})`);
      if (snap.fingerprint) L.push(`\n## 指纹\n- ${snap.fingerprint.hash.slice(0, 16)} · 熵≈${snap.fingerprint.entropyBits}b · ${snap.fingerprint.components.length} 因子${snap.fingerprint.lies.length ? ` · 矛盾 ${snap.fingerprint.lies.length} 项` : ""}`);
      if (snap.history) L.push(`\n## 历史\n- 24h 切换 ${snap.history.switches24h} · 7d ${snap.history.switches7d} · 轨迹 ${snap.history.trail.join(" → ")}`);
      if (snap.aiPack) L.push(`\n## AI 连通\n${snap.aiPack.map((a) => `- ${a.ok ? "✓" : "✗"} ${a.host}${a.ms ? ` ${a.ms}ms` : ""}`).join("\n")}`);
      text = L.join("\n");
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 回退:execCommand(http 环境等)
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedFmt(fmt);
    setTimeout(() => setCopiedFmt(null), 1600);
  };

  const steps = [t.steps.intel, t.steps.path, t.steps.reach, t.steps.leakEnv];
  const busy = phase === "running";
  const exitIp = claude?.ip || direct.ip;
  return (
    <div className="max-w-5xl mx-auto px-5">
      {/* Hero */}
      <section className="pt-14 pb-10 text-center fade-in">
        <span className="pill">{t.hero.badge}</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 leading-tight tracking-tight">{t.hero.title}</h1>
        <p className="text-soft text-sm sm:text-[15px] leading-relaxed max-w-2xl mx-auto mt-4">{t.hero.desc}</p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button onClick={run} disabled={busy} className="press px-6 py-2.5 rounded-full bg-accent text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-60 hover:opacity-95 transition-opacity">
            {busy ? <span className="pulse-dot" /> : phase === "done" ? <RotateCw size={15} /> : <Play size={15} />}
            {busy ? t.hero.testing : phase === "done" ? t.hero.rescan : t.hero.start}
          </button>
          {status ? (
            <span className="relative inline-block">
              <button
                className="pill cursor-pointer card-hover"
                onClick={() => setStatusOpen(!statusOpen)}
                style={status.indicator !== "none" && status.indicator !== "unknown" ? { borderColor: "var(--warn)", color: "var(--warn)" } : undefined}
              >
                {t.hero.officialStatus}: {(t.statusLevels && t.statusLevels[status.indicator]) || status.indicator}
                <ChevronDown size={12} className={`transition-transform ${statusOpen ? "rotate-180" : ""}`} />
              </button>
              {statusOpen ? (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" aria-label="close" onClick={() => setStatusOpen(false)} />
                  <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-72 card p-4 text-left fade-in" style={{ background: "var(--surface)" }}>
                    <div className="flex items-baseline justify-between mb-3">
                      <b className="text-[13px]">{t.hero.officialStatus} · status.anthropic.com</b>
                      <span className="text-[10.5px] text-muted">{t.compUpdated.replace("{t}", new Date(status.fetched_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))}</span>
                    </div>
                    <p className="text-[11.5px] text-muted mb-3 leading-relaxed">{status.description}</p>
                    <div className="space-y-2">
                      {status.components.map((c) => {
                        const tone = c.status === "operational" ? "var(--good)" : c.status === "degraded_performance" ? "var(--warn)" : ["partial_outage", "major_outage", "offline"].includes(c.status) ? "var(--bad)" : "var(--accent)";
                        return (
                          <div key={c.name} className="flex items-center justify-between gap-2 text-[12px]">
                            <span className="mono truncate">{c.name}</span>
                            <span className="flex items-center gap-1.5 shrink-0" style={{ color: tone }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} />
                              {(t.compStatus && t.compStatus[c.status]) || c.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted mt-3 pt-2 border-t border-line">{t.statusSource}</p>
                  </div>
                </>
              ) : null}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-muted mt-4 max-w-xl mx-auto">{t.hero.privacy}</p>
      </section>

      {/* 检测进度面板 v2 */}
      {busy || phase === "done" ? (
        <div className="card p-5 mb-6 overflow-hidden relative" style={{ opacity: phase === "done" ? 0.55 : 1, transition: "opacity .5s" }}>
          <div className="flex items-center justify-between gap-2">
            {steps.map((label, i) => {
              const done = ((stepBits >> i) & 1) === 1 || phase === "done";
              const active = i >= 0 && ((stepBits >> i) & 1) === 0 && busy && i === [0,1,2,3].find((k) => ((stepBits >> k) & 1) === 0);
              return (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold transition-all"
                    style={{
                      background: done ? "var(--good)" : active ? "var(--accent)" : "var(--line)",
                      color: done || active ? "#fff" : "var(--muted)",
                      animation: active ? "pulse-soft 1.2s ease-in-out infinite" : undefined,
                    }}
                  >
                    {done ? (
                      <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                        <path className="step-check" d="M2.5 6.2 5 8.7 9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ) : active ? (
                      <span className="inner-dot" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={`text-[11.5px] truncate transition-colors ${active ? "text-accent font-semibold" : done ? "text-soft" : "text-muted"}`}>{label}</span>
                  {i < steps.length - 1 ? <span className={`step-link hidden sm:block ${((stepBits >> i) & 1) === 1 || phase === "done" ? "filled" : ""}`} /> : null}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-baseline mt-2.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
            <span>
              {busy ? (
                <>
                  ▸ {steps[[0, 1, 2, 3].find((k) => ((stepBits >> k) & 1) === 0) ?? steps.length - 1]}
                  <span className="typing-dots"><i /><i /><i /></span>
                </>
              ) : (
                <span style={{ color: "var(--good)" }}>✓ {t.testingDone || "完成"}</span>
              )}
            </span>
            <span className="mono tabular-nums">{elapsed.toFixed(1)}s · {[0,1,2,3].filter((k) => ((stepBits >> k) & 1) === 1).length} / {steps.length}</span>
          </div>
          <div className="progress-track mt-2 h-1.5 rounded-full bg-line overflow-hidden">
            <span className="tick" style={{ left: "25%" }} />
            <span className="tick" style={{ left: "50%" }} />
            <span className="tick" style={{ left: "75%" }} />
            <div
              className="progress-fill h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.round(((phase === "done" ? 4 : [0,1,2,3].filter((k) => ((stepBits >> k) & 1) === 1).length) / steps.length) * 100))}%`,
                background: "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--good)))",
              }}
            />
          </div>
        </div>
      ) : null}

      {/* 视图切换 */}
      {phase === "done" ? (
        <div className="flex justify-center mb-5">
          <div className="flex rounded-full border border-line overflow-hidden text-xs bg-surface">
            <button onClick={() => switchMode("simple")} className={`px-4 py-1.5 font-medium transition-colors ${mode === "simple" ? "bg-accent text-white" : "text-muted hover:text-ink"}`}>
              {t.mode.simple}
            </button>
            <button onClick={() => switchMode("pro")} className={`px-4 py-1.5 font-medium transition-colors ${mode === "pro" ? "bg-accent text-white" : "text-muted hover:text-ink"}`}>
              {t.mode.pro}
            </button>
          </div>
        </div>
      ) : null}

      {/* 简明视图 */}
      {mode === "simple" && score && head && vCards ? (
        <div className="space-y-4">
          <HeadlineBand score={score.score} text={head.text} tone={head.tone as Tone} levelLabel={t.score.levels[score.level] ?? score.level} />
          <div className="flex justify-end gap-2">
            <button onClick={() => exportReport("md")} className={`pill card-hover cursor-pointer ${copiedFmt === "md" ? "flash-good" : ""}`}>{copiedFmt === "md" ? t.export.copied : t.export.md}</button>
            <button onClick={() => exportReport("json")} className={`pill card-hover cursor-pointer ${copiedFmt === "json" ? "flash-good" : ""}`}>{copiedFmt === "json" ? t.export.copied : t.export.json}</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 md:items-start stagger">
            {vCards.map((c) => (
              <VerdictCard key={c.key} title={c.title} subtitle={c.subtitle} tone={c.tone} label={t.expand}>
                {c.expandKey === "path" ? (
                  <PathPanel t={t.path} claude={claude} direct={direct} v4={dual.v4} v6={dual.v6} intel={intel} browserTz={env?.detail.timezone || ""} dns={dnsCheck} history={history} dnsLeak={dnsLeak} />
                ) : c.expandKey === "probes" ? (
                  <ProbeTable probes={probes} t={t.probes} />
                ) : c.expandKey === "env" ? (
                  <>
                    <EnvironmentPanel env={env} t={t.env} />
                    <div className="mt-4 pt-3 border-t border-line">
                      <h4 className="text-[12.5px] font-semibold mb-2">{t.fp.title}</h4>
                      <FingerprintPanel fp={fp} t={t.fp} compact />
                    </div>
                    {auto ? (
                      <div className="mt-3 pt-3 border-t border-line flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
                        <span className="text-muted">{t.auto.webdriver}: <b style={{ color: auto.webdriver ? "var(--bad)" : "var(--good)" }}>{auto.webdriver ? t.auto.on : t.auto.off}</b></span>
                        <span className="text-muted">{t.auto.cookie}: <b style={{ color: auto.cookie ? "var(--good)" : "var(--warn)" }}>{auto.cookie ? t.auto.on : t.auto.off}</b></span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <ReputationPanel data={rep} ip={exitIp} t={t.rep} />
                    {aiPack ? (
                      <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-x-4 gap-y-1">
                        {aiPack.map((p) => (
                          <div key={p.host} className="text-[11.5px] flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.status === "ok" ? "var(--good)" : "var(--bad)" }} />
                            <span className="mono truncate">{p.host}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </VerdictCard>
            ))}
          </div>
          {conclusions.length ? <InferenceCard conclusions={conclusions} t={t.inference} /> : null}
          {advices.length ? <AdviceCard items={advices} t={t.advice} /> : null}
          <AccountCard t={t.account} />
          {scans.length ? (
            <HistoryCard scans={scans} t={t.history} />
          ) : null}
        </div>
      ) : null}

      {/* 专业视图 */}
      {mode === "pro" ? (
      <>
      {/* 评分区 */}
      {score ? (
        <section className="grid md:grid-cols-[240px_1fr] gap-4 mb-4 fade-in">
          <div className="card p-6 flex flex-col items-center justify-center">
            <ScoreDial score={score.score} level={score.level} levelLabel={t.score.levels[score.level] ?? score.level} hint={t.score.hint} coverage={Math.round((score.coverage / 100) * 100)} />
            {score.gate ? (
              <p className="text-[11.5px] mt-3 px-2 text-center" style={{ color: "var(--bad)" }}>
                {t.score.gates[score.gate]}
              </p>
            ) : null}
          </div>
          <div className="card p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Radar size={15} className="text-accent" />{t.score.title}</h2>
            <DimensionBars dims={score.dimensions} labels={t.dims} codeLabels={t.dimCodes} />
            <div className="flex gap-2 mt-5">
              <button onClick={() => exportReport("md")} className={`pill card-hover cursor-pointer ${copiedFmt === "md" ? "flash-good" : ""}`}>{copiedFmt === "md" ? t.export.copied : t.export.md}</button>
              <button onClick={() => exportReport("json")} className={`pill card-hover cursor-pointer ${copiedFmt === "json" ? "flash-good" : ""}`}>{copiedFmt === "json" ? t.export.copied : t.export.json}</button>
            </div>
            {intelFailed ? <p className="text-[11px] text-muted mt-4">{t.err.intelFailed}</p> : null}
          </div>
        </section>
      ) : null}

      {mode === "pro" && conclusions.length ? (
        <section className="fade-in mb-4">
          <InferenceCard conclusions={conclusions} t={t.inference} />
        </section>
      ) : null}

      {/* 明细区 */}
      {phase !== "idle" ? (
        <section className="grid md:grid-cols-2 gap-4 fade-in">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Map size={14} className="text-accent" />{t.path.title}</h3>
            <PathPanel t={t.path} claude={claude} direct={direct} v4={dual.v4} v6={dual.v6} intel={intel} browserTz={env?.detail.timezone || ""} dns={dnsCheck} history={history} dnsLeak={dnsLeak} />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><Activity size={14} className="text-accent" />{t.probes.title}</h3>
            <ProbeTable probes={probes} t={t.probes} />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Fingerprint size={14} className="text-accent" />{t.env.title}</h3>
            <EnvironmentPanel env={env} t={t.env} />
            {auto ? (
              <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
                <span className="text-muted">{t.auto.webdriver}: <b style={{ color: auto.webdriver ? "var(--bad)" : "var(--good)" }}>{auto.webdriver ? t.auto.on : t.auto.off}</b></span>
                {auto.swiftShader ? <span className="text-muted">{t.dimCodes.swiftShader}</span> : null}
                {env?.platformSpoof?.fontContradiction ? <span style={{ color: "var(--bad)" }}>{t.auto.spoof}</span> : null}
                <span className="text-muted">{t.auto.cookie}: <b style={{ color: auto.cookie ? "var(--good)" : "var(--warn)" }}>{auto.cookie ? t.auto.on : t.auto.off}</b></span>
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Server size={14} className="text-accent" />{t.rep.title}</h3>
              <ReputationPanel data={rep} ip={exitIp} t={t.rep} />
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Radar size={14} className="text-accent" />{t.fp.title}</h3>
              <FingerprintPanel fp={fp} t={t.fp} />
            </div>
            <AccountCard t={t.account} />
            <CliCard t={t.cli} />
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2">{t.sources.title}</h3>
              <p className="text-[11.5px] text-muted leading-relaxed">{t.sources.geo}<br />{t.sources.risk}<br />{t.sources.cache}</p>
            </div>
          </div>
        </section>
      ) : null}

      {mode === "pro" && phase === "done" && scans.length ? (
        <section className="mt-4 fade-in">
          <HistoryCard scans={scans} t={t.history} />
        </section>
      ) : null}

      {/* AI 服务连通包 */}
      {aiPack ? (
        <section className="mt-4 fade-in">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><Activity size={14} className="text-accent" />{t.ai.title}</h3>
            <p className="text-[11px] text-muted mb-3">{t.ai.desc} <b style={{ color: aiPack.filter((x) => x.status === "ok").length >= 8 ? "var(--good)" : aiPack.filter((x) => x.status === "ok").length >= 5 ? "var(--warn)" : "var(--bad)" }}>{aiPack.filter((x) => x.status === "ok").length}/{aiPack.length} {t.ai.reachable}</b></p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1.5">
              {aiPack.map((p) => (
                <div key={p.host} className="text-[11.5px] flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.status === "ok" ? "var(--good)" : "var(--bad)" }} />
                  <span className="mono truncate" title={`${p.ip || ""} ${p.colo || ""} ${p.ms || 0}ms`}>{p.host}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 风控链路对照(知识层,来自社区逆向;工具本身不调用这些端点) */}
      {phase !== "idle" ? (
        <section className="mt-4 fade-in">
          <ChainCard t={t.chain} />
        </section>
      ) : null}
      </>
      ) : null}
    </div>
  );
}

function CliCard({ t }: { t: any }) {
  const [copied, setCopied] = useState(0);
  const copy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(0), 1500);
    } catch {}
  };
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><TerminalSquare size={14} className="text-accent" />{t.title}</h3>
      <p className="text-[11px] text-muted mb-3">{t.desc}</p>
      {(t.items ?? []).map((item: any, i: number) => (
        <details key={i} open={i === 0} className="border border-line rounded-lg mb-2 last:mb-0">
          <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer text-[12.5px] font-semibold select-none">
            <span className="flex items-center gap-2 min-w-0">
              <span className="mono text-[10px] text-muted shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate">{item.label}</span>
            </span>
            <span className="text-muted text-xs shrink-0">+</span>
          </summary>
          <div className="px-3 pb-2.5">
            <p className="text-[11px] text-muted mb-1.5">{item.note}</p>
            <div className="flex items-start gap-2 bg-bg border border-line rounded-md px-2.5 py-1.5">
              <code className="mono text-[10.5px] flex-1 break-all leading-relaxed text-soft">{item.cmd}</code>
              <button onClick={() => copy(item.cmd, i + 1)} className="text-muted hover:text-accent shrink-0 mt-0.5" aria-label="copy">
                {copied === i + 1 ? <Check size={12} style={{ color: "var(--good)" }} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
