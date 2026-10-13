"use client";
// 六维评分条
import type { Dimension } from "@/lib/types";

const ICONS: Record<string, string> = { network: " 网络", exposure: "📡", reputation: "🛡", consistency: "🔀", browser: "🧭", automation: "🤖" };

function fracColor(frac: number | null): string {
  if (frac === null) return "var(--muted)";
  if (frac >= 0.8) return "var(--good)";
  if (frac >= 0.5) return "var(--warn)";
  return "var(--bad)";
}

export default function DimensionBars({ dims, labels, codeLabels }: { dims: Dimension[]; labels: Record<string, { t: string; d: string }>; codeLabels: Record<string, string> }) {
  return (
    <div className="space-y-4">
      {dims.map((d) => (
        <div key={d.id}>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <div className="min-w-0">
              <span className="text-sm font-semibold">
                {labels[d.id]?.t ?? d.id}
                <span className="text-muted font-normal"> · {d.frac === null ? "—" : `${d.points}/${d.weight}`}</span>
              </span>
              <p className="text-[11px] text-muted truncate">{d.frac === null ? labels[d.id]?.d : codeLabels[d.code] ?? d.code}</p>
            </div>
            <span className="mono text-[11px] shrink-0" style={{ color: fracColor(d.frac) }}>
              {d.frac === null ? "N/A" : `${Math.round(d.frac * 100)}%`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bar-anim" style={{ width: d.frac === null ? "0%" : `${Math.max(2, d.frac * 100)}%`, background: fracColor(d.frac) }} />
          </div>
        </div>
      ))}
    </div>
  );
}
