"use client";
// Cloudflare Turnstile 信任检测(需 env TURNSTILE_SITEKEY,未配置显示待配置)
import { useRef, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { runTurnstile, type TurnstileResult } from "@/lib/detect/turnstile";

export default function TurnstileCard({ sitekey, t }: { sitekey: string | null; t: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<TurnstileResult | null>(null);

  const run = async () => {
    if (!sitekey || !ref.current || busy) return;
    setBusy(true);
    setRes(null);
    ref.current.innerHTML = "";
    const r = await runTurnstile(ref.current, sitekey);
    setRes(r);
    setBusy(false);
  };

  const tone = !res ? "var(--muted)" : res.passed && res.silent ? "var(--good)" : res.passed ? "var(--warn)" : "var(--bad)";
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        {res?.passed ? res.silent ? <ShieldCheck size={14} style={{ color: tone }} /> : <ShieldAlert size={14} style={{ color: tone }} /> : <ShieldCheck size={14} className="text-accent" />}
        {t.title}
      </h3>
      <p className="text-[11px] text-muted mb-3 leading-relaxed">{t.desc}</p>
      {sitekey ? (
        <>
          <button onClick={run} disabled={busy} className="press px-4 py-1.5 rounded-full bg-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-2">
            {busy ? <Loader2 size={12} className="spin" /> : null}
            {busy ? t.running : t.run}
          </button>
          <div ref={ref} className="mt-3 min-h-[65px]" />
          {res ? (
            <div className="mt-2 text-[12px] fade-in" style={{ color: tone }}>
              <b>{res.passed ? (res.silent ? t.silent : t.interactive) : t.failed}</b>
              <span className="text-muted"> · {res.ms}ms{res.error ? ` · ${res.error}` : ""}</span>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[11.5px] text-muted">{t.notConfigured}</p>
      )}
    </div>
  );
}
