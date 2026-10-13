"use client";
// reCAPTCHA v3 可信分(env RECAPTCHA_V3_SITEKEY + RECAPTCHA_V3_SECRET,opt-in)
import { useState } from "react";
import { Loader2, ScanFace } from "lucide-react";

export default function RecaptchaCard({ sitekey, t }: { sitekey: string | null; t: any }) {
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    if (!sitekey || busy) return;
    setBusy(true);
    setScore(null);
    setFailed(false);
    try {
      await new Promise<void>((resolve, reject) => {
        if ((globalThis as any).grecaptcha) return resolve();
        const sc = document.createElement("script");
        sc.src = `https://www.google.com/recaptcha/api.js?render=${sitekey}`;
        sc.onload = () => resolve();
        sc.onerror = () => reject(new Error("load"));
        document.head.appendChild(sc);
      });
      const g = (globalThis as any).grecaptcha;
      await new Promise((r) => g.ready(r));
      const token = await g.execute(sitekey, { action: "exitlens" });
      const v = await fetch("/api/recaptcha-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      }).then((r) => r.json());
      if (typeof v?.score === "number") setScore(v.score);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  if (!sitekey) return null;
  const tone = score === null ? "var(--muted)" : score >= 0.7 ? "var(--good)" : score >= 0.4 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <ScanFace size={14} className="text-accent" />
        {t.title}
      </h3>
      <p className="text-[11px] text-muted mb-3 leading-relaxed">{t.desc}</p>
      <button onClick={run} disabled={busy} className="press px-3.5 py-1.5 rounded-full border border-line text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5">
        {busy ? <Loader2 size={12} className="spin" /> : null}
        {t.run}
      </button>
      {score !== null ? (
        <div className="mt-2 fade-in">
          <b className="text-[13px]" style={{ color: tone }}>{score.toFixed(2)} / 1.0</b>
          <div className="h-1.5 mt-1 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bar-anim" style={{ width: `${score * 100}%`, background: tone }} />
          </div>
        </div>
      ) : null}
      {failed ? <p className="text-[12px] mt-2" style={{ color: "var(--bad)" }}>{t.failed}</p> : null}
      <p className="text-[10.5px] text-muted mt-2">{t.privacy}</p>
    </div>
  );
}
