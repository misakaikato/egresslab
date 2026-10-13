import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, dict } from "@/lib/i18n/config";
import { assessIp } from "@/lib/server/assess";
import { asnHistory } from "@/lib/server/intel/asnHistory";
import DimensionBars from "@/components/DimensionBars";
import { isSupportedCountry } from "@/lib/countries";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; ip: string }> }): Promise<Metadata> {
  const { ip } = await params;
  return { title: `IP ${decodeURIComponent(ip)} · ExitLens`, robots: { index: false } };
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "muted" }) {
  const color = tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : tone === "muted" ? "var(--muted)" : "var(--ink)";
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-line last:border-0">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="mono text-[12.5px] text-right break-all" style={{ color }}>{value}</span>
    </div>
  );
}

export default async function IpPage({ params }: { params: Promise<{ locale: string; ip: string }> }) {
  const { locale, ip: raw } = await params;
  if (!LOCALES.includes(locale as any)) notFound();
  const ip = decodeURIComponent(raw);
  const t = dict(locale);
  let result;
  try {
    result = await assessIp(ip, locale);
  } catch {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold mb-2 mono">{ip}</h1>
        <p className="text-sm text-muted">{t.ipPage.queryFailed}</p>
      </div>
    );
  }
  const hist = await asnHistory(ip).catch(() => null);
  const nt = result.intel?.network || {};
  const rk = result.intel?.risk || {};
  const geo = result.intel?.geo || {};
  const netTypeName = (t.netTypes as any)?.[nt.asn_type as string] || nt.asn_type || "—";

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl font-bold mono mb-1 break-all">{ip}</h1>
      <p className="text-sm text-muted mb-6">
        {geo.country_en || "?"}{geo.city ? ` · ${geo.city}` : ""} · {netTypeName}
        {isSupportedCountry(geo.country_code as string) === false ? ` · ${t.ipPage.unsupported}` : ""}
      </p>

      {/* 评分 */}
      {result.score ? (
        <div className="card p-6 mb-4 flex items-center gap-6">
          <span className="text-5xl font-bold tabular-nums" style={{ color: result.score.level === "low" || result.score.level === "watch" ? "var(--warn)" : "var(--bad)" }}>
            {result.score.total}
          </span>
          <div className="min-w-0">
            <b className="text-[14px]">{(t.score.levels as any)[result.score.level] || result.score.level}</b>
            <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{result.headline}</p>
            <p className="text-[10.5px] text-muted mt-1">{result.score.note}</p>
          </div>
        </div>
      ) : null}

      {/* 结论 */}
      {result.verdicts.length ? (
        <div className="card p-5 mb-4">
          {result.verdicts.map((v) => (
            <div key={v.key} className="py-2 border-b border-line last:border-0">
              <b className="text-[13.5px]">{v.title}</b>
              <p className="text-[12px] text-muted mt-0.5">{v.subtitle}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* 维度 */}
      <div className="card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-4">{t.score.title}</h3>
        <DimensionBars dims={(result.score as any)?.dimensions ?? []} labels={t.dims} codeLabels={t.dimCodes} />
      </div>

      {/* 情报明细 */}
      <div className="card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-2">{t.ipPage.intelTitle}</h3>
        <Row label="ASN" value={`${nt.asn ?? "—"} ${nt.asn_name || ""}`} />
        <Row label={t.path.netClass} value={`${netTypeName}${nt.pdb_type ? ` (${nt.pdb_type})` : ""}`} />
        <Row label={t.path.native} value={nt.native === true ? t.path.nativeYes : nt.native === false ? t.path.nativeNo : "—"} tone={nt.native === false ? "bad" : "muted"} />
        <Row label={t.path.ptr} value={(nt as any).ptr?.host || "—"} />
        <Row label={t.path.prefix} value={String(rk.prefix_first_seen || "—").slice(0, 10)} tone={rk.prefix_first_seen && Date.now() - new Date(rk.prefix_first_seen).getTime() < 90 * 86400_000 ? "bad" : undefined} />
        <Row label={t.path.neighbors} value={`${rk.neighbors_flagged ?? 0} / 2`} tone={(rk.neighbors_flagged ?? 0) > 0 ? "bad" : "muted"} />
        <Row label="VPN / 代理 / 机房 / Tor" value={`${rk.is_vpn ? "✓" : "✗"} / ${rk.is_proxy ? "✓" : "✗"} / ${rk.is_datacenter ? "✓" : "✗"} / ${rk.is_tor ? "✓" : "✗"}`} tone={rk.is_vpn || rk.is_proxy || rk.is_datacenter || rk.is_tor ? "bad" : "good"} />
        <Row label={`abuse / blacklist`} value={`${rk.abuse_score ?? 0} / ${rk.blacklist_score ?? 0}`} tone={(rk.abuse_score ?? 0) >= 30 || (rk.blacklist_score ?? 0) >= 50 ? "bad" : "muted"} />
        <Row label={t.sources.title} value={(rk.sources || []).join(", ")} tone="muted" />
      </div>

      {/* ASN 历史 */}
      {hist ? (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold mb-2">{t.ipPage.asnHistory} <span className="mono text-[11px] text-muted">{hist.prefix}</span></h3>
          <div className="space-y-1">
            {hist.events.map((e, i) => (
              <div key={i} className="flex items-baseline gap-3 text-[11.5px]">
                <span className="mono text-muted shrink-0 w-20">{e.start}</span>
                <span className="mono shrink-0">AS{e.origin}</span>
                <span className="text-muted">{e.end ? `→ ${e.end}` : t.ipPage.now}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 卡片与 API */}
      <div className="card p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/card?style=ink&ip=${encodeURIComponent(ip)}`} alt="card" width={360} style={{ height: "auto", maxWidth: "100%", borderRadius: 10 }} className="mb-3" />
        <p className="text-[11px] text-muted">
          API: <code className="mono">/api/v1/check?ip={ip}</code> · <a className="text-accent" href={`/${locale}/card?ip=${encodeURIComponent(ip)}`}>{t.cardPage.title}</a>
        </p>
      </div>
    </div>
  );
}
