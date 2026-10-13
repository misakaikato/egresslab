"use client";
// 出口矩阵:每个站点看到的你,按出口 IP 分组
import { useState } from "react";
import { Network, Loader2 } from "lucide-react";
import { runEchoMatrix, type EchoMatrix } from "@/lib/detect/echomatrix";

export default function EchoMatrixCard({ t }: { t: any }) {
  const [busy, setBusy] = useState(false);
  const [mx, setMx] = useState<EchoMatrix | null>(null);
  const run = async () => {
    setBusy(true);
    setMx(await runEchoMatrix());
    setBusy(false);
  };
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Network size={14} className="text-accent" />
        {t.title}
      </h3>
      <p className="text-[11px] text-muted mb-3">{t.desc}</p>
      <button onClick={run} disabled={busy} className="press px-3.5 py-1.5 rounded-full bg-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5">
        {busy ? <Loader2 size={12} className="spin" /> : null}
        {busy ? t.running : t.run}
      </button>
      {mx ? (
        <div className="mt-3 space-y-3 fade-in">
          {mx.groups.map((g) => (
            <div key={g.ip}>
              <div className="flex items-baseline gap-2 mb-1">
                <code className="mono text-[12px] font-bold">{g.ip}</code>
                <span className="pill border-0 px-1.5 text-[10px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {g.sites.length} {t.sites}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {g.sites.map((n) => {
                  const site = mx.sites.find((s) => s.name === n);
                  return (
                    <div key={n} className="flex justify-between text-[11px]">
                      <span className="text-muted truncate">{n}{site?.kind === "cn" ? " ·CN" : ""}</span>
                      <span className="mono tabular-nums">{site?.medianMs !== null && site?.medianMs !== undefined ? `${site.medianMs}ms` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
