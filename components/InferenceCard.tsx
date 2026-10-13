"use client";
// 深度研判卡:二阶结论 + 可展开证据链
import { useState } from "react";
import { BrainCircuit, ChevronDown } from "lucide-react";
import type { Conclusion } from "@/lib/inference";

const TONE: Record<string, string> = { good: "var(--good)", warn: "var(--warn)", bad: "var(--bad)", neutral: "var(--muted)" };
const CONF_TONE: Record<string, string> = { high: "var(--good)", medium: "var(--warn)", low: "var(--muted)" };

export default function InferenceCard({ conclusions, t }: { conclusions: Conclusion[]; t: any }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!conclusions.length) return null;
  return (
    <div className="card overflow-hidden fade-in">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BrainCircuit size={15} className="text-accent" />
          {t.title}
          <span className="pill border-0 ml-1" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            {conclusions.length}
          </span>
        </h3>
        <p className="text-[10.5px] text-muted mt-1">{t.note}</p>
      </div>
      <div className="divide-y divide-line">
        {conclusions.map((c, i) => (
          <div key={c.id} className="rise-item" style={{ animationDelay: `${i * 0.05}s` }}>
            <button className="w-full text-left px-5 py-3 flex items-start gap-3" onClick={() => setOpen(open === i ? null : i)}>
              <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: TONE[c.tone] }} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-semibold leading-snug">{c.title}</span>
                <span className="block text-[12px] text-muted mt-0.5 leading-relaxed">{c.subtitle}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `color-mix(in srgb, ${CONF_TONE[c.confidence]} 12%, transparent)`, color: CONF_TONE[c.confidence] }}>
                  {t.conf[c.confidence]}
                </span>
                <ChevronDown size={13} className={`text-muted transition-transform ${open === i ? "rotate-180" : ""}`} />
              </span>
            </button>
            {open === i ? (
              <div className="px-5 pb-3.5 pl-10 fade-in">
                <ul className="space-y-1">
                  {c.evidence.map((e, j) => (
                    <li key={j} className="text-[11.5px] text-soft mono leading-relaxed">
                      <span className="text-muted mr-1.5">·</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
