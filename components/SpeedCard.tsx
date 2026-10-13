"use client";
// Cloudflare 测速 + 全球入站延迟
import { useState } from "react";
import { Gauge, Globe2, Loader2 } from "lucide-react";
import { downSpeed, upSpeed, edgeLatency, globalPing } from "@/lib/detect/speed";

export default function SpeedCard({ targetIp, t }: { targetIp: string; t: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [down, setDown] = useState<{ mbps: number | null; via: string | null } | null>(null);
  const [ran, setRan] = useState(false);
  const [up, setUp] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [ping, setPing] = useState<{ loc: string; ms: number | null }[]>([]);

  const runSpeed = async () => {
    setBusy("speed");
    setRan(true);
    const [d, u, l] = await Promise.all([downSpeed(), upSpeed(), edgeLatency()]);
    setDown(d);
    setUp(u);
    setLat(l);
    setBusy(null);
  };
  const runPing = async () => {
    if (!targetIp) return;
    setBusy("ping");
    setPing(await globalPing(targetIp));
    setBusy(null);
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Gauge size={14} className="text-accent" />
        {t.title}
      </h3>
      <p className="text-[11px] text-muted mb-3">{t.desc}</p>
      <div className="flex gap-2 mb-3">
        <button onClick={runSpeed} disabled={!!busy} className="press px-3.5 py-1.5 rounded-full bg-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5">
          {busy === "speed" ? <Loader2 size={12} className="spin" /> : null}
          {t.runSpeed}
        </button>
        <button onClick={runPing} disabled={!!busy || !targetIp} className="press px-3.5 py-1.5 rounded-full border border-line text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5">
          {busy === "ping" ? <Loader2 size={12} className="spin" /> : <Globe2 size={12} />}
          {t.runPing}
        </button>
      </div>
      {ran ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] fade-in">
          <span className="text-muted">{t.down}: {down?.mbps != null ? <b className="text-ink">{down.mbps} Mbps{down.via ? <span className="text-[10px] text-muted"> ({down.via})</span> : null}</b> : <b style={{ color: "var(--bad)" }}>{t.unreachable}</b>}</span>
          <span className="text-muted">{t.up}: {up != null ? <b className="text-ink">{up} Mbps</b> : <b style={{ color: "var(--bad)" }}>{t.unreachable}</b>}</span>
          <span className="text-muted">{t.latency}: {lat != null ? <b className="text-ink">{lat} ms</b> : <b style={{ color: "var(--bad)" }}>{t.unreachable}</b>}</span>
          {down?.mbps == null && up == null ? <p className="basis-full text-[11px]" style={{ color: "var(--warn)" }}>{t.blockedNote}</p> : null}
        </div>
      ) : null}
      {ran && !busy && ping.length === 0 ? (
        <p className="mt-3 pt-3 border-t border-line text-[11.5px] fade-in" style={{ color: "var(--warn)" }}>{t.pingFailed}</p>
      ) : null}
      {ping.length ? (
        <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-x-4 gap-y-1 fade-in">
          {ping.map((p, i) => (
            <div key={i} className="flex justify-between text-[11.5px]">
              <span className="text-muted truncate">{p.loc}</span>
              <span className="mono tabular-nums">{p.ms !== null ? `${p.ms} ms` : "—"}</span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-[10.5px] text-muted mt-3">{t.note}</p>
    </div>
  );
}
