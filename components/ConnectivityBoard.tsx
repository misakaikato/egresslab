"use client";
// 网络连通性看板:分组卡片 + 延迟档位配色 + 单组刷新
import { useCallback, useEffect, useState } from "react";
import { CONN_SITES, probeGroup, latencyBand, type ConnGroup, type ConnResult } from "@/lib/detect/connectivity";
import { RefreshCw } from "lucide-react";

const GROUPS: ConnGroup[] = ["cn", "jp", "us", "global"];
const BAND_COLOR = { great: "var(--good)", ok: "var(--accent)", slow: "var(--warn)", fail: "var(--bad)" };

export default function ConnectivityBoard({ t }: { t: any }) {
  const [results, setResults] = useState<Map<string, ConnResult>>(new Map());
  const [running, setRunning] = useState<Set<ConnGroup>>(new Set());

  const runGroup = useCallback(async (g: ConnGroup) => {
    setRunning((s) => new Set(s).add(g));
    // 先置 pending
    setResults((m) => {
      const n = new Map(m);
      for (const s of CONN_SITES.filter((x) => x.group === g)) n.set(s.name, { site: s, status: "pending", ms: null });
      return n;
    });
    await probeGroup(g, (r) => setResults((m) => new Map(m).set(r.site.name, r)));
    setRunning((s) => {
      const n = new Set(s);
      n.delete(g);
      return n;
    });
  }, []);

  useEffect(() => {
    GROUPS.forEach((g) => void runGroup(g));
  }, [runGroup]);

  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        const sites = CONN_SITES.filter((s) => s.group === g);
        const rs = sites.map((s) => results.get(s.name)).filter((r): r is ConnResult => !!r && r.status === "ok");
        const avg = rs.length ? Math.round(rs.reduce((a, r) => a + (r.ms ?? 0), 0) / rs.length) : null;
        const busy = running.has(g);
        return (
          <div key={g} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2.5">
                <b className="text-[14px]">{(t.groups as any)[g]}</b>
                <span className="text-[11px] text-muted">
                  {t.reachable} {rs.length}/{sites.length}
                  {avg !== null ? ` · ${t.avg} ${avg}ms` : ""}
                </span>
              </div>
              <button onClick={() => void runGroup(g)} disabled={busy} className="pill card-hover cursor-pointer text-[11px] flex items-center gap-1 disabled:opacity-50">
                <RefreshCw size={11} className={busy ? "animate-spin" : ""} />
                {t.refresh}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {sites.map((s) => {
                const r = results.get(s.name);
                const band = r ? latencyBand(r.ms) : "fail";
                return (
                  <div key={s.name} className="border border-line rounded-lg px-2.5 py-2 text-center" title={s.url}>
                    <div className="text-[11.5px] truncate">{s.name}</div>
                    <div className="mono text-[11px] tabular-nums mt-0.5" style={{ color: r?.status === "pending" || !r ? "var(--muted)" : BAND_COLOR[band] }}>
                      {!r || r.status === "pending" ? "…" : r.status === "fail" ? t.timeout : `${r.ms}ms`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted leading-relaxed">{t.footnote}</p>
    </div>
  );
}
