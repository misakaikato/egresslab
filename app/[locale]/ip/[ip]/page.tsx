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

      {/* 纯净度(Trust Score) */}
      {result.intel?.trust ? (
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-6">
            <span
              className="text-5xl font-bold tabular-nums"
              style={{
                color:
                  result.intel.trust.grade === "pure" ? "var(--good)"
                  : result.intel.trust.grade === "good" ? "var(--accent)"
                  : result.intel.trust.grade === "fair" ? "var(--warn)"
                  : "var(--bad)",
              }}
            >
              {result.intel.trust.score}
            </span>
            <div className="min-w-0">
              <b className="text-[14px]">
                {t.trust.title} · {(t.trust.grades as any)[result.intel.trust.grade] || result.intel.trust.grade}
              </b>
              <p className="text-[10.5px] text-muted mt-1 leading-relaxed">{t.trust.hint}</p>
            </div>
          </div>
          {/* 刻度条 */}
          <div className="progress-track mt-4 h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${result.intel.trust.score}%`,
                background: "linear-gradient(90deg, var(--bad), var(--warn) 40%, var(--good) 80%)",
              }}
            />
          </div>
          {/* 扣分因子 */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.intel.trust.factors.length ? (
              result.intel.trust.factors.map((f) => (
                <span key={f.key} className="pill text-[10.5px]" style={{ color: "var(--bad)" }}>
                  {(t.trust.factors as any)[f.key] || f.key} −{f.delta}{f.value ? ` (${f.value})` : ""}
                </span>
              ))
            ) : (
              <span className="text-[11px]" style={{ color: "var(--good)" }}>✓ {t.trust.clean}</span>
            )}
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
        {rk.open_ports !== undefined && rk.open_ports !== null ? (
          <Row label={t.ports.label} value={rk.open_ports.length ? rk.open_ports.join(", ") : t.ports.none} tone={rk.open_ports.length ? "bad" : "good"} />
        ) : null}
        {rk.open_ports?.length ? <p className="text-[10.5px] text-muted mt-1 leading-relaxed">{t.ports.hint}</p> : null}
        <Row label={t.sources.title} value={(rk.sources || []).join(", ")} tone="muted" />
      </div>

      {/* 场景评估 */}
      {result.scenes?.length ? (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold mb-1">{t.scenes.title}</h3>
          <p className="text-[10.5px] text-muted mb-3">{t.scenes.note}</p>
          <div className="space-y-2.5">
            {result.scenes.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-[12.5px] w-20 shrink-0">{(t.scenes.ids as any)[s.id] || s.id}</span>
                <span className="mono text-[13px] font-semibold w-5 text-right tabular-nums">{s.score}</span>
                <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.score * 10}%`,
                      background: s.score >= 7 ? "var(--good)" : s.score >= 5 ? "var(--warn)" : "var(--bad)",
                    }}
                  />
                </div>
                <span
                  className="text-[11px] w-14 text-right shrink-0"
                  style={{ color: s.score >= 7 ? "var(--good)" : s.score >= 5 ? "var(--warn)" : "var(--bad)" }}
                >
                  {(t.scenes.grades as any)[s.grade] || s.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* DNSBL 黑名单明细 */}
      {(rk.dnsbl_detail?.length ?? 0) > 0 ? (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold mb-1">{t.dnsbl.title}</h3>
          <p className="text-[11px] text-muted mb-3">
            {t.dnsbl.summary.replace("{total}", String(rk.dnsbl_detail!.length)).replace("{hit}", String(rk.dnsbl_detail!.filter((x) => x.listed).length))}
          </p>
          <div className="divide-y divide-line">
            {rk.dnsbl_detail!.map((z) => (
              <div key={z.zone} className="flex items-center justify-between gap-3 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: z.listed ? "var(--bad)" : "var(--good)" }} />
                  <span className="text-[12px] shrink-0">{z.name}</span>
                  <span className="mono text-[10.5px] text-muted truncate hidden sm:inline">{z.zone}</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 text-[11px]">
                  <span className="pill text-[10px]">{(t.dnsbl.cats as any)[z.cat] || z.cat}</span>
                  <span style={{ color: z.listed ? "var(--bad)" : "var(--good)" }}>{z.listed ? t.dnsbl.listed : t.dnsbl.clean}</span>
                  <span className="text-muted tabular-nums w-14 text-right">{z.ms} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 多源地理对比 */}
      {(geo.sources?.length ?? 0) >= 2 ? (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold mb-2">{t.geoCmp.title}</h3>
          <div className="divide-y divide-line">
            {geo.sources!.map((s) => (
              <div key={s.source} className="flex items-center justify-between gap-3 py-1.5">
                <span className="mono text-[11.5px] text-muted shrink-0 w-24">{s.source}</span>
                <span className="text-[12px] truncate min-w-0 flex-1">{[s.country, s.city].filter(Boolean).join(" / ") || "—"}</span>
                <span className="mono text-[10.5px] text-muted shrink-0">
                  {s.latitude !== null && s.longitude !== null ? `${s.latitude.toFixed(2)}, ${s.longitude.toFixed(2)}` : "—"}
                </span>
              </div>
            ))}
          </div>
          {typeof geo.max_distance_km === "number" ? (
            <p className="text-[11px] mt-3" style={{ color: geo.max_distance_km > 800 ? "var(--warn)" : "var(--muted)" }}>
              {t.geoCmp.maxOffset}: <b className="mono">{geo.max_distance_km} {t.geoCmp.km}</b> · {t.geoCmp.note}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* BGP 拓扑 */}
      {nt.asn_detail || nt.upstreams?.length ? (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold mb-2">{t.bgp.title}</h3>
          {nt.asn_detail ? (
            <>
              <Row label={t.bgp.holder} value={nt.asn_detail.holder} />
              <Row label={t.bgp.prefixes} value={`v4 × ${nt.asn_detail.prefixes_v4.toLocaleString()} · v6 × ${nt.asn_detail.prefixes_v6.toLocaleString()}`} />
            </>
          ) : null}
          {nt.upstreams?.length ? (
            <div className="mt-3">
              <p className="text-[11px] text-muted mb-2">{t.bgp.upstreams}</p>
              <div className="space-y-1.5">
                {nt.upstreams.map((u) => (
                  <div key={u.asn} className="flex items-center gap-2.5">
                    <span className="mono text-[11.5px] w-20 shrink-0">AS{u.asn}</span>
                    <span className="text-[11.5px] truncate min-w-0 flex-1">
                      {u.name || "—"}
                      {u.tier1 ? <span className="pill text-[9.5px] ml-1.5" style={{ color: "var(--accent)" }}>{t.bgp.tier1}</span> : null}
                    </span>
                    <div className="w-24 h-1.5 rounded-full bg-line overflow-hidden shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, u.share)}%`, background: u.tier1 ? "var(--accent)" : "var(--muted)" }} />
                    </div>
                    <span className="mono text-[10.5px] text-muted w-12 text-right tabular-nums shrink-0">{u.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-[10px] text-muted mt-3">{t.bgp.src}</p>
        </div>
      ) : null}

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
