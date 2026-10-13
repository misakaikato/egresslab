import { notFound } from "next/navigation";
import { LOCALES, dict } from "@/lib/i18n/config";

// 评分说明页:六维权重 / 门控 / 等级 / 数据源(公开口径)
export default async function ScoringPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as any)) notFound();
  const t = dict(locale);
  const dims: [string, number, string][] = [
    ["network", 35, (t.dims as any).network?.d],
    ["exposure", 20, (t.dims as any).exposure?.d],
    ["reputation", 15, (t.dims as any).reputation?.d],
    ["consistency", 15, (t.dims as any).consistency?.d],
    ["browser", 10, (t.dims as any).browser?.d],
    ["automation", 5, (t.dims as any).automation?.d],
  ];
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">{t.scoringPage.title}</h1>
      <p className="text-sm text-muted mb-8 leading-relaxed">{t.scoringPage.intro}</p>
      <div className="card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">{t.scoringPage.dimsTitle}</h3>
        {dims.map(([k, w, d]) => (
          <div key={k} className="py-2 border-b border-line last:border-0">
            <div className="flex justify-between items-baseline">
              <b className="text-[13px]">{(t.dims as any)[k]?.t}</b>
              <span className="mono text-[12px] text-accent">{w}</span>
            </div>
            <p className="text-[11.5px] text-muted mt-0.5">{d}</p>
          </div>
        ))}
      </div>
      <div className="card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-2">{t.scoringPage.gatesTitle}</h3>
        <ul className="space-y-1.5 text-[12px] text-soft">
          <li>· {t.scoringPage.g1}</li>
          <li>· {t.scoringPage.g2}</li>
          <li>· {t.scoringPage.g3}</li>
        </ul>
      </div>
      <div className="card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-2">{t.scoringPage.levelsTitle}</h3>
        <p className="text-[12px] text-muted mono">≥80 {t.score.levels.low} · ≥60 {t.score.levels.watch} · ≥40 {t.score.levels.high} · &lt;40 {t.score.levels.severe}</p>
        <p className="text-[11px] text-muted mt-2">{t.scoringPage.coverageNote}</p>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-2">{t.scoringPage.srcTitle}</h3>
        <p className="text-[11.5px] text-muted leading-relaxed">{t.sources.geo}<br />{t.sources.risk}<br />{t.sources.cache}</p>
      </div>
    </div>
  );
}
