"use client";
// Claude 风控链路对照:来自社区逆向/抓包的知识层,工具不调用这些端点
import { GitBranch, AlertTriangle, Fingerprint } from "lucide-react";

const SRC_TONE: Record<string, string> = {
  "实测": "var(--good)",
  "observed": "var(--good)",
  "実測": "var(--good)",
  "开源": "var(--info, var(--accent))",
  "OSS": "var(--info, var(--accent))",
  "静态": "var(--muted)",
  "static": "var(--muted)",
  "静的": "var(--muted)",
};

export default function ChainCard({ t }: { t: any }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <GitBranch size={14} className="text-accent" />
        {t.title}
      </h3>
      <p className="text-[11px] text-muted mb-4 leading-relaxed">{t.note}</p>
      <ol className="relative border-l border-line ml-1.5 space-y-4">
        {(t.stages ?? []).map((s: any, i: number) => (
          <li key={i} className="pl-4 relative">
            <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[13px] font-semibold">{s.name}</span>
              <span className="pill border-0 px-1.5 py-0 text-[10px]" style={{ color: SRC_TONE[s.src] || "var(--muted)", background: "color-mix(in srgb, var(--line) 40%, transparent)" }}>
                {s.src}
              </span>
              <code className="mono text-[10.5px] text-muted truncate">{s.ep}</code>
            </div>
            <p className="text-[11.5px] text-soft mt-0.5">{s.check}</p>
            <p className="text-[11px] text-muted mt-0.5">→ {s.dim}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5">
        <h4 className="text-[12.5px] font-semibold mb-2 flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-accent" />
          {t.errorsTitle}
        </h4>
        <div className="space-y-2">
          {(t.errors ?? []).map((e: any, i: number) => (
            <div key={i} className="text-[11.5px]">
              <code className="mono text-[11px] text-accent">{e.code}</code>
              <span className="text-soft"> — {e.meaning}</span>
              <p className="text-muted mt-0.5">↳ {e.action}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted mt-4 pt-3 border-t border-line flex gap-1.5 leading-relaxed">
        <Fingerprint size={13} className="shrink-0 mt-0.5 text-accent" />
        {t.deviceId}
      </p>
    </div>
  );
}
