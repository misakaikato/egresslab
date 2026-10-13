"use client";
// 浏览器指纹面板:构成因子 + 哈希 + 估算熵(全本地)
import { Fingerprint } from "lucide-react";
import type { FingerprintResult } from "@/lib/detect/fingerprint";

export default function FingerprintPanel({ fp, t, compact = false }: { fp: FingerprintResult | null; t: any; compact?: boolean }) {
  if (!fp) return <p className="text-xs text-muted">{t.pending}</p>;
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
          <span className="text-muted"> (≈ 1/2^{fp.entropyBits})</span>
        </span>
      </div>
      <div className={compact ? "grid grid-cols-1 gap-y-1" : "grid sm:grid-cols-2 gap-x-6 gap-y-1"}>
        {fp.components.map((c) => (
          <div key={c.key} className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="text-muted shrink-0">
              {t.keys[c.key] ?? c.key}
              <span className="text-[10px]"> +{c.bits}b</span>
            </span>
            <span className="mono text-[11px] text-right truncate max-w-[62%]" title={c.value}>
              {c.value}
            </span>
          </div>
        ))}
      </div>
      {fp.unavailable.length ? (
        <p className="text-[11px] mt-2" style={{ color: "var(--warn)" }}>
          {t.unavailableNote}: {fp.unavailable.join(", ")}
        </p>
      ) : null}
      <p className="text-[10.5px] text-muted mt-3">{t.local}</p>
    </div>
  );
}
