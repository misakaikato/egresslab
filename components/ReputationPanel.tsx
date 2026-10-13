"use client";
// 历史信誉面板:自建库记录 + 反馈提交
import { useState } from "react";
import { History, Send } from "lucide-react";

export interface RepData {
  ok: boolean;
  ip: string;
  known: boolean;
  first_seen: number | null;
  last_seen: number | null;
  check_count: number;
  last_score: number | null;
  feedback: { ts: number; note: string; score: number | null }[];
}

export default function ReputationPanel({ data, ip, t }: { data: RepData | null; ip: string; t: any }) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!note.trim()) return;
    try {
      await fetch("/api/reputation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ip, note: note.trim() }) });
      setSent(true);
      setNote("");
    } catch {}
  };
  const fmt = (ts: number | null) => (ts ? new Date(ts).toLocaleString() : "—");
  return (
    <div className="space-y-3">
      {!data || !data.known ? (
        <p className="text-xs text-muted">{ip ? t.none : "—"}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          <div><span className="text-muted text-[11px] block">{t.firstSeen}</span>{fmt(data.first_seen)}</div>
          <div><span className="text-muted text-[11px] block">{t.lastSeen}</span>{fmt(data.last_seen)}</div>
          <div><span className="text-muted text-[11px] block">{t.checks}</span>{data.check_count}</div>
          <div><span className="text-muted text-[11px] block">{t.lastScore}</span>{data.last_score ?? "—"}</div>
          {data.feedback.slice(0, 3).map((f, i) => (
            <div key={i} className="col-span-2 text-[11.5px] text-soft flex items-center gap-1.5">
              <History size={12} className="text-muted shrink-0" />
              <span className="truncate">{f.note}</span>
            </div>
          ))}
        </div>
      )}
      {ip ? (
        <div>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => { setNote(e.target.value); setSent(false); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t.feedbackPlaceholder}
              className="flex-1 min-w-0 text-[12.5px] px-3 py-1.5 rounded-lg bg-bg border border-line outline-none focus:border-accent"
            />
            <button onClick={submit} disabled={!note.trim()} className="shrink-0 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5">
              <Send size={12} /> {t.submit}
            </button>
          </div>
          {sent ? <p className="text-[11px] mt-1.5" style={{ color: "var(--good)" }}>{t.thanks}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
