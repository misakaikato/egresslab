"use client";
// 浏览器指纹面板:因子表 + 哈希 + 熵 + 伪装矛盾检测(全本地)
import { Fingerprint, ShieldAlert, ShieldCheck } from "lucide-react";
import type { FingerprintResult } from "@/lib/detect/fingerprint";
import { CLAUDE_COLLECTS } from "@/lib/detect/fingerprint";

const LIE_TONE: Record<string, string> = { timingReduced: "var(--warn)" };

export default function FingerprintPanel({ fp, t, compact = false }: { fp: FingerprintResult | null; t: any; compact?: boolean }) {
  if (!fp) return <p className="text-xs text-muted">{t.pending}</p>;
  const items = compact ? fp.components.slice(0, 12) : fp.components;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <span className="flex items-center gap-1.5 text-[12.5px]">
          <Fingerprint size={13} className="text-accent" />
          <span className="text-muted">{t.hash}:</span>
          <code className="mono text-[12px]">{fp.hash.slice(0, 16)}</code>
        </span>
        <span className="text-[12px] text-muted">
          {t.entropy}: <b className="text-ink">≈ {fp.entropyBits} {t.bits}</b>
        </span>
        <span className="text-[12px] text-muted">
          {t.factors}: <b className="text-ink">{fp.components.length}</b>
        </span>
        <span className="pill border-0 px-1.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }} title={t.claudeNote}>
          {t.claudeMark} {fp.components.filter((c) => CLAUDE_COLLECTS.has(c.key)).length}
        </span>
      </div>
      <div className={compact ? "grid grid-cols-1 gap-y-1" : "grid sm:grid-cols-2 gap-x-6 gap-y-1"}>
        {items.map((c) => (
          <div key={c.key} className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="text-muted shrink-0">
              {t.keys[c.key] ?? c.key}
              <span className="text-[10px]"> +{c.bits}b</span>
              {CLAUDE_COLLECTS.has(c.key) ? <span className="ml-1 text-[9px] px-1 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }} title={t.claudeNote}>C</span> : null}
            </span>
            <span className="mono text-[11px] text-right truncate max-w-[62%]" title={c.value}>
              {c.value}
            </span>
          </div>
        ))}
      </div>
      {compact && fp.components.length > 12 ? <p className="text-[11px] text-muted mt-1">+{fp.components.length - 12} {t.more}</p> : null}
      {/* 伪装矛盾检测 */}
      <div className="mt-3 pt-3 border-t border-line">
        <h4 className="text-[12px] font-semibold mb-1.5 flex items-center gap-1.5">
          {fp.lies.length ? <ShieldAlert size={12} style={{ color: "var(--bad)" }} /> : <ShieldCheck size={12} style={{ color: "var(--good)" }} />}
          {t.lies.title}
          {fp.lies.length ? <span style={{ color: "var(--bad)" }}>· {fp.lies.length}</span> : null}
        </h4>
        {fp.lies.length ? (
          <ul className="space-y-1">
            {fp.lies.map((lie, i) => (
              <li key={i} className="text-[11.5px] flex gap-1.5">
                <span className="shrink-0" style={{ color: LIE_TONE[lie.key] || "var(--bad)" }}>•</span>
                <span className="text-soft">
                  <b style={{ color: LIE_TONE[lie.key] || "var(--bad)" }}>{t.lies.keys[lie.key] ?? lie.key}</b>
                  <span className="text-muted"> — {lie.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11.5px]" style={{ color: "var(--good)" }}>{t.lies.none}</p>
        )}
        {fp.unavailable.length ? (
          <p className="text-[11px] mt-2" style={{ color: "var(--warn)" }}>
            {t.unavailableNote}: {fp.unavailable.join(", ")}
          </p>
        ) : null}
      </div>
      <p className="text-[10.5px] text-muted mt-3">{t.local}</p>
    </div>
  );
}
