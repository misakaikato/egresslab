"use client";
// 大陆环境特征面板(7 信号)
import type { EnvScanResult } from "@/lib/detect/environment";

const LEVEL_COLOR = { high: "var(--bad)", medium: "var(--warn)", low: "var(--good)" } as const;

export default function EnvironmentPanel({ env, t }: { env: EnvScanResult | null; t: any }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-muted">{t.desc}</p>
        {env ? (
          <span className="pill border-0 shrink-0 ml-3" style={{ background: `color-mix(in srgb, ${LEVEL_COLOR[env.level]} 14%, transparent)`, color: LEVEL_COLOR[env.level] }}>
            {t.scoreLabel} {env.score} · {t.level[env.level]}
          </span>
        ) : null}
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {(env?.items ?? []).map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="text-soft">
              {t.signals[s.key] ?? s.key}
              <span className="text-muted text-[11px]"> ·{s.weight}</span>
            </span>
            <span className="mono text-[11.5px] truncate max-w-[55%]" style={{ color: s.frac > 0 ? "var(--bad)" : "var(--muted)" }} title={s.value}>
              {s.frac > 0 ? `+${s.score}` : "0"} · {s.frac > 0 ? `${s.value}` : t.notDetected}
            </span>
          </div>
        ))}
        {!env ? <p className="text-xs text-muted">{t.underScore ?? "—"}</p> : null}
      </div>
      <p className="text-[11px] text-muted mt-3 flex items-center gap-1">{t.privacy}</p>
    </div>
  );
}
