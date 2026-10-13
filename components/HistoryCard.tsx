"use client";
// 本机检测历史(localStorage)
import { History } from "lucide-react";
import type { ScanRecord } from "@/lib/detect/scanHistory";

const LEVEL_COLOR: Record<string, string> = {
  low: "var(--good)",
  watch: "var(--warn)",
  high: "var(--bad)",
  severe: "var(--bad)",
  blocked: "var(--bad)",
  unreachable: "var(--muted)",
};

export default function HistoryCard({ scans, t }: { scans: ScanRecord[]; t: any }) {
  const recent = [...scans].reverse().slice(0, 6);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <History size={14} className="text-accent" />
        {t.title}
        <span className="pill border-0 ml-1" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          {t.count.replace("{n}", String(scans.length))}
        </span>
      </h3>
      {scans.length < 2 ? (
        <p className="text-xs text-muted">{t.empty}</p>
      ) : (
        <div className="space-y-2">
          {recent.map((s, i) => {
            const prev = recent[i + 1];
            const delta = prev ? s.score - prev.score : null;
            return (
              <div key={s.ts} className="flex items-center gap-3 text-[12px]">
                <span className="mono tabular-nums font-bold w-7 shrink-0" style={{ color: LEVEL_COLOR[s.level] || "var(--muted)" }}>
                  {s.score}
                </span>
                <span className="text-muted shrink-0 w-[9.5rem] truncate">{new Date(s.ts).toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1 min-w-0 truncate text-soft" title={s.headline}>
                  {s.headline}
                  {s.verdicts[0] ? ` · ${s.verdicts[0]}` : ""}
                </span>
                {delta !== null ? (
                  <span className="shrink-0 tabular-nums" style={{ color: delta > 0 ? "var(--good)" : delta < 0 ? "var(--bad)" : "var(--muted)" }}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10.5px] text-muted mt-3">{t.local}</p>
    </div>
  );
}
