"use client";
// 检测编排器:点击开始 → 并行探测 → 聚合 → 评分 → 渲染
import { useCallback, useEffect, useMemo, useState } from "react";
import { dict } from "@/lib/i18n/config";
import { computeScore } from "@/lib/score";
import type { IntelResult, ScoreInput, TraceProbe, WebRtcResult } from "@/lib/types";
import { probeTrace, ANTHROPIC_HOSTS } from "@/lib/detect/trace";
import { probeDirect, distinctExits, recordExit, type HistoryVerdict, type EchoResult } from "@/lib/detect/direct";
import { probeAiPack } from "@/lib/detect/aipack";
import { probeDualStack, StackInfo } from "@/lib/detect/dualstack";
import { detectWebRtc } from "@/lib/detect/webrtc";
import { scanEnvironment, EnvScanResult } from "@/lib/detect/environment";
import { collectAutomation } from "@/lib/detect/automation";
import { checkDns, type DnsCheck } from "@/lib/detect/dns";
import { coloToCountry } from "@/lib/colos";
import ScoreDial from "./ScoreDial";
import DimensionBars from "./DimensionBars";
import ProbeTable from "./ProbeTable";
import PathPanel from "./PathPanel";
import EnvironmentPanel from "./EnvironmentPanel";
import ReputationPanel, { RepData } from "./ReputationPanel";
import ChainCard from "./ChainCard";
import { buildVerdicts, headline, type Tone } from "@/lib/verdicts";
import { HeadlineBand, VerdictCard } from "./VerdictCard";
import { Play, RotateCw, TerminalSquare, Copy, Check, Activity, Map, Radar, Fingerprint, Server } from "lucide-react";

type Phase = "idle" | "running" | "done";
interface AutoInfo { webdriver: boolean; cookie: boolean; webglRenderer: string; swiftShader: boolean }

export default function Detector({ locale }: { locale: string }) {
  const t = useMemo(() => dict(locale), [locale]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0); // 0-4 进度
  const [probes, setProbes] = useState<TraceProbe[]>([]);
  const [direct, setDirect] = useState<{ ip: string; via: string; exits: EchoResult[] }>({ ip: "", via: "", exits: [] });
  const [history, setHistory] = useState<HistoryVerdict | null>(null);
  const [aiPack, setAiPack] = useState<TraceProbe[] | null>(null);
  const [dual, setDual] = useState<{ v4: StackInfo | null; v6: StackInfo | null }>({ v4: null, v6: null });
  const [intel, setIntel] = useState<IntelResult | null>(null);
  const [intelFailed, setIntelFailed] = useState(false);
  const [webrtc, setWebrtc] = useState<WebRtcResult>({ status: "idle", publicIps: [] });
  const [env, setEnv] = useState<EnvScanResult | null>(null);
  const [auto, setAuto] = useState<AutoInfo | null>(null);
  const [dnsCheck, setDns] = useState<DnsCheck | null>(null);
  const [mode, setMode] = useState<"simple" | "pro">("simple");
  useEffect(() => {
    try { const v = localStorage.getItem("egresslab:view"); if (v === "pro" || v === "simple") setMode(v); } catch {}
  }, []);
  const switchMode = (m: "simple" | "pro") => { setMode(m); try { localStorage.setItem("egresslab:view", m); } catch {} };
  const [rep, setRep] = useState<RepData | null>(null);
  const [status, setStatus] = useState<{ indicator: string; description: string } | null>(null);

  useEffect(() => {
    fetch("/api/claude/status").then((r) => r.json()).then((j) => j?.ok && setStatus({ indicator: j.indicator, description: j.description })).catch(() => {});
  }, []);

  const run = useCallback(async () => {
    setPhase("running");
    setStep(0);
    setProbes([]);
    setIntel(null);
    setIntelFailed(false);
    setEnv(null);
    setAuto(null);
    setRep(null);
    setWebrtc({ status: "checking", publicIps: [] });
    // 1. 并行:三域名 trace + 直连 + 双栈
    const hostList = [...ANTHROPIC_HOSTS];
    setProbes(hostList.map((h) => ({ host: h, status: "pending", ip: "", country: "", warp: "", colo: "", ms: 0, fallback: false, httpStatus: 0, challenged: false })));
    const [traceList, directR, dualR] = await Promise.all([
      Promise.all(hostList.map((h) => probeTrace(h))),
      probeDirect(),
      probeDualStack(),
    ]);
    setProbes(traceList);
    setDirect(directR);
    setDual(dualR);
    setStep(1);
    // 2. IP 情报
    const claudeIp = traceList[0]?.ip || "";
    const targetIp = claudeIp || directR.ip;
    let intelR: IntelResult | null = null;
    if (targetIp) {
      try {
        const res = await fetch(`/api/ip/${encodeURIComponent(targetIp)}`);
        intelR = await res.json();
        if (!intelR?.ok) intelR = null;
      } catch {}
    }
    setIntel(intelR);
    setIntelFailed(!!targetIp && !intelR);
    setStep(2);
    // 3. WebRTC + DNS + 环境 + 自动化
    const [webrtcR, envR, dnsR, aiR] = await Promise.all([detectWebRtc(), scanEnvironment(), checkDns(), probeAiPack()]);
    setWebrtc(webrtcR);
    setEnv(envR);
    setDns(dnsR);
    setAiPack(aiR);
    setAuto(collectAutomation());
    const exitCountry = traceList[0]?.country || intelR?.geo?.country_code || "";
    const exitIpForHist = claudeIp || directR.ip;
    if (exitIpForHist) setHistory(recordExit(exitIpForHist, String(exitCountry || "").toUpperCase()));
    setStep(3);
    // 4. 历史信誉
    const repIp = claudeIp || directR.ip;
    if (repIp) {
      try {
        const rj = await fetch(`/api/reputation?ip=${encodeURIComponent(repIp)}`).then((r) => r.json());
        setRep(rj);
      } catch {}
    }
    setStep(4);
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

  const exportReport = (fmt: "md" | "json") => {
    if (!score) return;
    const snap = {
      ts: new Date().toISOString(),
      score: { total: score.score, level: score.level, coverage: score.coverage, gate: score.gate, region: score.region },
      dimensions: score.dimensions.map((d) => ({ id: d.id, weight: d.weight, points: d.points, frac: d.frac, code: d.code })),
      exits: { claude: claude?.ip || null, direct: distinctExits(direct.exits), v4: dual.v4?.ip || null, v6: dual.v6?.ip || null },
      intel: intel ? { geo: intel.geo, network: intel.network, risk: intel.risk } : null,
      webrtc: { status: webrtc.status, ips: webrtc.publicIps },
      dns: dnsCheck,
      env: env ? { score: env.score, level: env.level, signals: env.items.map((i) => ({ k: i.key, score: i.score, value: i.value })) } : null,
      automation: auto,
      history: history ? { switches24h: history.switches24h, switches7d: history.switches7d, trail: history.trail } : null,
      aiPack: aiPack ? aiPack.map((p) => ({ host: p.host, ok: p.status === "ok", ms: p.ms, ip: p.ip, colo: p.colo })) : null,
    };
    let blob: Blob;
    if (fmt === "json") {
      blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    } else {
      const L: string[] = [];
      L.push(`# EgressLab 报告 · ${snap.ts}`);
      L.push(`\n**评分 ${score.score}/100 · ${score.level}${score.gate ? ` · gate: ${score.gate}` : ""} · 出口地区 ${score.region || "—"}**\n`);
      L.push(`| 维度 | 得分 | 判定 |\n|---|---|---|`);
      for (const d of snap.dimensions) L.push(`| ${d.id} | ${d.frac === null ? "N/A" : `${d.points}/${d.weight}`} | ${d.code} |`);
      L.push(`\n## 出口\n- Claude: ${snap.exits.claude || "—"}\n- 直连: ${snap.exits.direct.join(", ") || "—"}\n- v4/v6: ${snap.exits.v4 || "—"} / ${snap.exits.v6 || "—"}`);
      if (snap.intel?.risk) L.push(`\n## IP 情报\n- 类型: ${snap.intel.network?.asn_type} · ASN ${snap.intel.network?.asn} ${snap.intel.network?.asn_name}\n- 风险: VPN=${snap.intel.risk.is_vpn} 代理=${snap.intel.risk.is_proxy} 机房=${snap.intel.risk.is_datacenter} Tor=${snap.intel.risk.is_tor}\n- abuse=${snap.intel.risk.abuse_score} blacklist=${snap.intel.risk.blacklist_score} 前缀首见=${snap.intel.risk.prefix_first_seen || "—"}`);
      if (snap.env) L.push(`\n## 环境\n- 大陆特征 ${snap.env.score}/100 (${snap.env.level})`);
      if (snap.history) L.push(`\n## 历史\n- 24h 切换 ${snap.history.switches24h} 次 · 7d ${snap.history.switches7d} 次 · 轨迹 ${snap.history.trail.join(" → ")}`);
      if (snap.aiPack) L.push(`\n## AI 连通\n${snap.aiPack.map((a) => `- ${a.ok ? "✓" : "✗"} ${a.host}${a.ms ? ` ${a.ms}ms` : ""}`).join("\n")}`);
      blob = new Blob([L.join("\n")], { type: "text/markdown" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `egresslab-report-${Date.now()}.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
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
          <button onClick={run} disabled={busy} className="px-6 py-2.5 rounded-full bg-accent text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-60 hover:opacity-95 transition-opacity">
            {busy ? <Activity size={15} className="spin" /> : phase === "done" ? <RotateCw size={15} /> : <Play size={15} />}
            {busy ? t.hero.testing : phase === "done" ? t.hero.rescan : t.hero.start}
          </button>
          {status ? (
            <span className="pill" title={status.description}>
              {t.hero.officialStatus}: {status.indicator === "none" ? "OK" : status.indicator}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-muted mt-4 max-w-xl mx-auto">{t.hero.privacy}</p>
      </section>

      {/* 步骤条 */}
      {phase !== "idle" ? (
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {steps.map((label, i) => (
            <span key={i} className="pill" style={i < step ? { borderColor: "var(--good)", color: "var(--good)" } : i === step && busy ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}>
              {i < step ? "✓" : i === step && busy ? "•" : ""} {label}
            </span>
          ))}
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
            <button onClick={() => exportReport("md")} className="pill card-hover cursor-pointer">{t.export.md}</button>
            <button onClick={() => exportReport("json")} className="pill card-hover cursor-pointer">{t.export.json}</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {vCards.map((c) => (
              <VerdictCard key={c.key} title={c.title} subtitle={c.subtitle} tone={c.tone} label={t.expand}>
                {c.expandKey === "path" ? (
                  <PathPanel t={t.path} claude={claude} direct={direct} v4={dual.v4} v6={dual.v6} intel={intel} browserTz={env?.detail.timezone || ""} dns={dnsCheck} history={history} />
                ) : c.expandKey === "probes" ? (
                  <ProbeTable probes={probes} t={t.probes} />
                ) : c.expandKey === "env" ? (
                  <>
                    <EnvironmentPanel env={env} t={t.env} />
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
              <button onClick={() => exportReport("md")} className="pill card-hover cursor-pointer">{t.export.md}</button>
              <button onClick={() => exportReport("json")} className="pill card-hover cursor-pointer">{t.export.json}</button>
            </div>
            {intelFailed ? <p className="text-[11px] text-muted mt-4">{t.err.intelFailed}</p> : null}
          </div>
        </section>
      ) : null}

      {/* 明细区 */}
      {phase !== "idle" ? (
        <section className="grid md:grid-cols-2 gap-4 fade-in">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Map size={14} className="text-accent" />{t.path.title}</h3>
            <PathPanel t={t.path} claude={claude} direct={direct} v4={dual.v4} v6={dual.v6} intel={intel} browserTz={env?.detail.timezone || ""} dns={dnsCheck} history={history} />
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
            <CliCard t={t.cli} />
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2">{t.sources.title}</h3>
              <p className="text-[11.5px] text-muted leading-relaxed">{t.sources.geo}<br />{t.sources.risk}<br />{t.sources.cache}</p>
            </div>
          </div>
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
