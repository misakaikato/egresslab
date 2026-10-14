"use client";
// ChatGPT/GPT 出口专项:探测 OpenAI 系站点的实际出口 IP,再查该 IP 的纯净度与场景评分
import { useCallback, useEffect, useState } from "react";
import { probeCfTrace, type CfTrace } from "@/lib/detect/cftrace";
import { sceneScores, type SceneScore } from "@/lib/server/scenarios";
import type { IntelResult } from "@/lib/types";
import { RefreshCw } from "lucide-react";

const PROBES = [
  { host: "chatgpt.com", label: "ChatGPT" },
  { host: "api.openai.com", label: "OpenAI API" },
];

const GRADE_COLOR: Record<string, string> = {
  excellent: "var(--good)", recommended: "var(--good)", usable: "var(--accent)",
  marginal: "var(--warn)", notRecommended: "var(--bad)",
};

function trustColor(s: number) {
  return s >= 80 ? "var(--good)" : s >= 60 ? "var(--accent)" : s >= 40 ? "var(--warn)" : "var(--bad)";
}

export default function GptBoard({ t }: { t: any }) {
  const [probes, setProbes] = useState<Map<string, CfTrace>>(new Map());
  const [intel, setIntel] = useState<IntelResult | null>(null);
  const [scenes, setScenes] = useState<SceneScore[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const run = useCallback(async () => {
    setBusy(true);
    setErr("");
    setIntel(null);
    setScenes([]);
    setProbes(new Map());
    const rs = await Promise.all(
      PROBES.map(async (p) => {
        const r = await probeCfTrace(p.host, 12000);
        setProbes((m) => new Map(m).set(p.host, r));
        return r;
      })
    );
    const chatgpt = rs[0];
    if (!chatgpt.ok || !chatgpt.ip) {
      setErr("unreachable");
      setBusy(false);
      return;
    }
    try {
      const r = await fetch(`/api/ip/${encodeURIComponent(chatgpt.ip)}`, { cache: "no-store" });
      const j = (await r.json()) as IntelResult;
      if (!j.ok) throw new Error();
      setIntel(j);
      setScenes(sceneScores(j));
    } catch {
      setErr("intelFailed");
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const cg = probes.get("chatgpt.com");
  const api = probes.get("api.openai.com");
  const mismatch = cg?.ok && api?.ok && cg.ip && api.ip && cg.ip !== api.ip;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <b className="text-[14px]">{t.exitTitle}</b>
          <button onClick={() => void run()} disabled={busy} className="pill card-hover cursor-pointer text-[11px] flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={11} className={busy ? "animate-spin" : ""} />
            {t.refresh}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {PROBES.map((p) => {
            const r = probes.get(p.host);
            return (
              <div key={p.host} className="rounded-lg border border-line px-3.5 py-3">
                <div className="text-[11px] text-muted mb-1">{p.label} <span className="opacity-70">{p.host}</span></div>
                {!r ? (
                  <div className="text-[12.5px] text-muted">{t.probing}</div>
                ) : !r.ok ? (
                  <div className="text-[12.5px]" style={{ color: "var(--bad)" }}>{t.unreachable}</div>
                ) : (
                  <>
                    <div className="font-mono text-[14px] font-semibold">{r.ip}</div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {r.loc} · {r.colo} · {r.ms}ms{r.warp && r.warp !== "off" ? ` · WARP ${r.warp}` : ""}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {mismatch ? (
          <div className="mt-3 text-[12px]" style={{ color: "var(--warn)" }}>{t.mismatch}</div>
        ) : null}
        {err ? <div className="mt-3 text-[12px]" style={{ color: "var(--bad)" }}>{(t.err as any)[err] || err}</div> : null}
      </div>

      {intel?.trust ? (
        <div className="card p-5">
          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <div className="text-[11px] text-muted mb-0.5">{t.trustLabel}</div>
              <div className="font-display text-4xl font-bold" style={{ color: trustColor(intel.trust.score) }}>
                {intel.trust.score}
                <span className="text-base text-muted font-normal">/100</span>
              </div>
              <div className="text-[11.5px] mt-0.5" style={{ color: trustColor(intel.trust.score) }}>
                {(t.grades as any)[intel.trust.grade] || intel.trust.grade}
              </div>
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="text-[11px] text-muted mb-1.5">{t.sceneLabel}</div>
              <div className="space-y-1.5">
                {scenes.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[11.5px] w-20 shrink-0">{(t.scenes as any)[s.id]}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, background: GRADE_COLOR[s.grade] }} />
                    </div>
                    <span className="text-[11px] font-mono w-6 text-right">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
            <div><span className="text-muted">{t.geo}: </span>{[intel.geo?.city, intel.geo?.country_en].filter(Boolean).join(", ") || "—"}</div>
            <div><span className="text-muted">ASN: </span>{intel.network?.asn ? `AS${intel.network.asn}` : "—"} {intel.network?.asn_name || ""}</div>
            <div><span className="text-muted">{t.type}: </span>{intel.network?.asn_type || "—"}{intel.network?.native === false ? ` · ${t.nonNative}` : ""}</div>
            <div><span className="text-muted">{t.riskFlags}: </span>
              {[
                intel.risk?.is_tor && "Tor", intel.risk?.is_vpn && "VPN", intel.risk?.is_proxy && "Proxy",
                intel.risk?.is_datacenter && (t.datacenter || "Datacenter"), intel.risk?.is_abuser && "Abuser",
              ].filter(Boolean).join(" / ") || t.clean}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
