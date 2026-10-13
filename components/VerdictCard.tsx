"use client";
// 简明视图:总评横幅 + 4 张自然语言状态卡(可展开专业面板)
import { useState, type ReactNode } from "react";
import { ChevronDown, Check, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import type { Tone } from "@/lib/verdicts";
import { useCountUp } from "./ScoreDial";

const TONE_META: Record<Tone, { color: string; bar: string; Icon: any }> = {
  good: { color: "var(--good)", bar: "var(--good)", Icon: Check },
  warn: { color: "var(--warn)", bar: "var(--warn)", Icon: AlertTriangle },
  bad: { color: "var(--bad)", bar: "var(--bad)", Icon: XCircle },
  neutral: { color: "var(--muted)", bar: "var(--line)", Icon: MinusCircle },
};

export function HeadlineBand({ score, text, tone, levelLabel }: { score: number; text: string; tone: Tone; levelLabel: string }) {
  const m = TONE_META[tone];
  const shown = useCountUp(score);
  return (
    <div className="card overflow-hidden fade-in">
      <div className="flex items-center gap-5 px-6 py-5">
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[44px] leading-none font-bold tabular-nums" style={{ color: m.color }}>
            {shown}
          </span>
          <span className="text-[10.5px] text-muted mt-1">{levelLabel}</span>
        </div>
        <div className="h-10 w-px bg-line" />
        <p className="text-[15.5px] font-medium leading-snug" style={{ color: "var(--ink)" }}>
          {text}
        </p>
      </div>
      <div className="h-[3px]" style={{ background: m.bar }} />
    </div>
  );
}

export function VerdictCard({ title, subtitle, tone, label, children }: { title: string; subtitle: string; tone: Tone; label: { open: string; close: string }; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const m = TONE_META[tone];
  return (
    <div className="card overflow-hidden card-hover fade-in">
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start gap-3.5 px-5 py-4">
        <span className="mt-0.5 w-8 h-8 rounded-full grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${m.color} 12%, transparent)` }}>
          <m.Icon size={16} style={{ color: m.color }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug">{title}</span>
          <span className="block text-[12.5px] text-muted mt-1 leading-relaxed">{subtitle}</span>
        </span>
        <span className="shrink-0 mt-1 flex items-center gap-1 text-[11px]" style={{ color: "var(--muted)" }}>
          {open ? label.close : label.open}
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open ? (
        <div className="px-5 pb-5 pt-1 border-t border-line fade-in">
          <div className="pt-3">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
