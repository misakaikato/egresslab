"use client";
// Cloudflare 测速 + 全球入站延迟
import { useState } from "react";
import { Gauge, Globe2, Loader2 } from "lucide-react";
import { downSpeed, upSpeed, edgeLatency, globalPing } from "@/lib/detect/speed";

export default function SpeedCard({ targetIp, t }: { targetIp: string; t: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [down, setDown] = useState<number | null>(null);
  const [up, setUp] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [ping, setPing] = useState<{ loc: string; ms: number | null }[]>([]);

  const runSpeed = async () => {
    setBusy("speed");
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
      {down !== null || up !== null || lat !== null ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] fade-in">
          {down !== null ? <span className="text-muted">{t.down}: <b className="text-ink">{down} Mbps</b></span> : null}
          {up !== null ? <span className="text-muted">{t.up}: <b className="text-ink">{up} Mbps</b></span> : null}
          {lat !== null ? <span className="text-muted">{t.latency}: <b className="text-ink">{lat} ms</b></span> : null}
        </div>
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
