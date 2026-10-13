"use client";
// 建议卡:按 立即处理 / 建议优化 / 保持现状 分组的动作清单
import { Wrench, TrendingUp, ShieldCheck } from "lucide-react";
import type { AdviceItem } from "@/lib/advice";

const META: Record<AdviceItem["tone"], { icon: any; color: string; labelKey: string }> = {
  fix: { icon: Wrench, color: "var(--bad)", labelKey: "fix" },
  improve: { icon: TrendingUp, color: "var(--warn)", labelKey: "improve" },
  keep: { icon: ShieldCheck, color: "var(--good)", labelKey: "keep" },
};

export default function AdviceCard({ items, t }: { items: AdviceItem[]; t: any }) {
  if (!items.length) return null;
  const groups: AdviceItem["tone"][] = ["fix", "improve", "keep"];
  return (
    <div className="card p-5 fade-in">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Wrench size={14} className="text-accent" />
        {t.title}
      </h3>
      <div className="space-y-4">
        {groups.map((g) => {
          const list = items.filter((i) => i.tone === g);
          if (!list.length) return null;
          const m = META[g];
          return (
            <div key={g}>
              <div className="flex items-center gap-1.5 mb-2">
                <m.icon size={12} style={{ color: m.color }} />
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: m.color }}>
                  {t.groups[g]}
                </span>
                <span className="text-[10px] text-muted">{list.length}</span>
              </div>
              <ul className="space-y-2">
                {list.map((item, i) => (
                  <li key={i} className="flex gap-2 rise-item" style={{ animationDelay: `${i * 0.04}s` }}>
                    <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: m.color }} />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium leading-snug">{item.title}</span>
                      {item.detail ? <span className="block text-[11.5px] text-muted mt-0.5 leading-relaxed">{item.detail}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-[10.5px] text-muted mt-4 pt-3 border-t border-line">{t.note}</p>
    </div>
  );
}
