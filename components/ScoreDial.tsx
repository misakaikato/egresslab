"use client";
// 评分表盘:SVG 环形 + 数字滚动 + 等级色
import { useEffect, useState } from "react";
import type { ScoreResult } from "@/lib/types";

export function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || target <= 0) {
      setV(target);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - t, 5))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

const LEVEL_COLOR: Record<string, string> = {
  low: "var(--good)",
  watch: "var(--warn)",
  high: "var(--bad)",
  severe: "var(--bad)",
  blocked: "var(--bad)",
  unreachable: "var(--muted)",
};

export default function ScoreDial({ score, level, levelLabel, hint, coverage }: { score: number; level: string; levelLabel: string; hint: string; coverage: number }) {
  const R = 74;
  const C = 2 * Math.PI * R;
  const color = LEVEL_COLOR[level] || "var(--muted)";
  const offset = C * (1 - Math.min(100, Math.max(0, score)) / 100);
  const shown = useCountUp(score);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] h-[180px]">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle cx="90" cy="90" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} className="dial-anim" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums" style={{ color }}>
            {shown}
          </span>
          <span className="text-xs text-muted mt-1">{hint}</span>
        </div>
      </div>
      <span className="pill mt-3 border-0" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
        {levelLabel}
      </span>
      <span className="text-[11px] text-muted mt-1.5">coverage {coverage}%</span>
    </div>
  );
}
