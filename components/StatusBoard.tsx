"use client";
// 服务状态看板:故障/维护置顶,分组渲染
import { useCallback, useEffect, useState } from "react";
import type { ServiceStatus } from "@/lib/server/statuspage";
import { RefreshCw } from "lucide-react";

const GROUPS = ["ai", "dev", "app"] as const;
const IND_ORDER: Record<string, number> = { critical: 0, major: 1, minor: 2, maintenance: 3, unknown: 4, none: 5 };
const IND_COLOR: Record<string, string> = {
  none: "var(--good)", maintenance: "var(--accent)", minor: "var(--warn)",
  major: "var(--bad)", critical: "var(--bad)", unknown: "var(--muted)",
};

export default function StatusBoard({ t }: { t: any }) {
  const [data, setData] = useState<{ at: string; services: ServiceStatus[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setErr(true);
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) return <div className="card p-5 text-[13px]" style={{ color: "var(--bad)" }}>{t.loadFailed}</div>;
  if (!data) return <div className="card p-5 text-[13px] text-muted">{t.loading}</div>;

  const sorted = [...data.services].sort((a, b) => (IND_ORDER[a.indicator] ?? 9) - (IND_ORDER[b.indicator] ?? 9));
  const troubled = sorted.filter((s) => s.indicator !== "none" && s.indicator !== "unknown");
  const okCount = data.services.filter((s) => s.indicator === "none").length;

  const renderRow = (s: ServiceStatus) => (
    <div key={s.id} className="flex items-center gap-2.5 py-2 border-b border-line/50 last:border-0">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: IND_COLOR[s.indicator] || "var(--muted)" }} />
      <span className="text-[13px] font-medium flex-1 min-w-0 truncate">{s.name}</span>
      {s.incidents.map((i, k) => (
        <a key={k} href={i.link || "#"} target="_blank" rel="noreferrer" className="text-[11px] underline decoration-dotted truncate max-w-[220px]" style={{ color: IND_COLOR[s.indicator] }}>
          {i.name}
        </a>
      ))}
      {s.maintenances.length > 0 && s.incidents.length === 0 ? (
        <span className="text-[11px] text-muted truncate max-w-[220px]">{s.maintenances[0].name}</span>
      ) : null}
      <span className="text-[11px] shrink-0" style={{ color: IND_COLOR[s.indicator] || "var(--muted)" }}>
        {(t.ind as any)[s.indicator] || s.indicator}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card p-5 flex items-center justify-between">
        <div className="text-[13px]">
          <b>{okCount}/{data.services.length}</b> {t.allOk}
          <span className="text-muted"> · {t.updated} {new Date(data.at).toLocaleTimeString()}</span>
        </div>
        <button onClick={() => void load()} disabled={busy} className="pill card-hover cursor-pointer text-[11px] flex items-center gap-1 disabled:opacity-50">
          <RefreshCw size={11} className={busy ? "animate-spin" : ""} />
          {t.refresh}
        </button>
      </div>

      {troubled.length > 0 ? (
        <div className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <b className="text-[14px] block mb-2">{t.attention}</b>
          {troubled.map(renderRow)}
        </div>
      ) : null}

      {GROUPS.map((g) => {
        const list = sorted.filter((s) => s.group === g && !troubled.includes(s));
        if (!list.length) return null;
        return (
          <div key={g} className="card p-5">
            <b className="text-[14px] block mb-2">{(t.groups as any)[g]}</b>
            {list.map(renderRow)}
          </div>
        );
      })}
    </div>
  );
}
