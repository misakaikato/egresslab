import { notFound } from "next/navigation";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { dict, LOCALES } from "@/lib/i18n/config";

// 分享报告只读页:24h 过期
export default async function SharePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const lang = LOCALES.includes(locale as any) ? locale : "zh";
  const t = dict(lang);
  let data: any = null;
  try {
    const db = new DatabaseSync(path.join(process.cwd(), "data", "exitlens.db"));
    const row = db.prepare("SELECT ts, json FROM shares WHERE id=?").get(id) as any;
    if (row && Date.now() - row.ts < 86_400_000) data = JSON.parse(row.json);
  } catch {}
  if (!data) notFound();
  const scoreTone = (data.score?.total ?? 0) >= 80 ? "var(--good)" : (data.score?.total ?? 0) >= 60 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      <p className="text-[11px] text-muted mb-1">{t.share.readonly} · {new Date(data.ts).toLocaleString()} · 24h</p>
      <h1 className="font-display text-2xl font-bold mb-4">{t.share.title}</h1>
      <div className="card p-5 mb-3 flex items-center gap-5">
        <span className="text-4xl font-bold tabular-nums" style={{ color: scoreTone }}>{data.score?.total ?? "—"}</span>
        <div className="min-w-0">
          <b className="text-[13.5px]">{data.headline}</b>
          {data.exit ? <p className="mono text-[11px] text-muted mt-1 break-all">{data.exit}</p> : null}
        </div>
      </div>
      {Array.isArray(data.verdicts) && data.verdicts.length ? (
        <div className="card p-5 mb-3">
          {data.verdicts.map((v: any, i: number) => (
            <div key={i} className="py-2 border-b border-line last:border-0">
              <b className="text-[13px]">{v.title}</b>
              <p className="text-[11.5px] text-muted mt-0.5">{v.subtitle}</p>
            </div>
          ))}
        </div>
      ) : null}
      {Array.isArray(data.conclusions) && data.conclusions.length ? (
        <div className="card p-5">
          <h3 className="text-[12.5px] font-semibold mb-2">{t.inference.title}</h3>
          {data.conclusions.slice(0, 8).map((c: any, i: number) => (
            <div key={i} className="py-1.5 border-b border-line last:border-0 text-[12px]">
              <b>{c.title}</b> <span className="text-muted">· {t.inference.conf?.[c.confidence] || c.confidence}</span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-[10.5px] text-muted mt-4 text-center">ExitLens · exitlens.misakamikoto.top</p>
    </div>
  );
}
