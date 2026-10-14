"use client";
// 分流测试矩阵卡片:出口 IP 汇总 + 按分组/类别展示每站出口
import { useMemo } from "react";
import Link from "next/link";
import type { SiteProbe, SiteCat } from "@/lib/detect/sitematrix";
import { matrixExits } from "@/lib/detect/sitematrix";

const CAT_ORDER: SiteCat[] = ["cn", "ai", "social", "crypto", "tools", "static", "dev", "media", "speed"];

function Dot({ status }: { status: SiteProbe["status"] }) {
  const color = status === "ok" ? "var(--good)" : status === "pending" ? "var(--muted)" : "var(--bad)";
  return <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: color }} />;
}

export default function SiteMatrixCard({ sites, t, locale }: { sites: SiteProbe[]; t: any; locale: string }) {
  const exits = useMemo(() => matrixExits(sites), [sites]);
  const groups = useMemo(() => {
    const byCat = new Map<SiteCat, SiteProbe[]>();
    for (const s of sites) {
      const arr = byCat.get(s.cat) || [];
      arr.push(s);
      byCat.set(s.cat, arr);
    }
    return CAT_ORDER.filter((c) => byCat.has(c)).map((c) => ({ cat: c, items: byCat.get(c)! }));
  }, [sites]);
  const traced = sites.filter((s) => s.ip && !s.fallback).length;
  const reachable = sites.filter((s) => s.status === "ok").length;

  return (
    <div>
      {/* 出口汇总 */}
      {exits.length ? (
        <div className="mb-4">
          <p className="text-[11px] text-muted mb-2">{t.exitSummary.replace("{n}", String(exits.length))}</p>
          <div className="flex flex-wrap gap-2">
            {exits.map((e) => (
              <Link
                key={e.ip}
                href={`/${locale}/ip/${encodeURIComponent(e.ip)}`}
                className="pill card-hover mono text-[11.5px] flex items-center gap-1.5 no-underline"
                title={t.clickIp}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                {e.ip}
                <span className="text-muted">{e.country || "??"} · ×{e.count}{e.warp ? " · WARP" : ""}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* 分组表 */}
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.cat}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold" style={{ color: g.cat === "cn" ? "var(--good)" : "var(--accent)" }}>
                {(t.cats && t.cats[g.cat]) || g.cat}
              </span>
              <span className="text-[10.5px] text-muted">{g.items.filter((s) => s.status === "ok").length}/{g.items.length}</span>
            </div>
            <div className="divide-y divide-line border border-line rounded-lg px-3">
              {g.items.map((s) => (
                <div key={s.host} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Dot status={s.status} />
                    <span className="text-[12px] shrink-0">{s.name}</span>
                    <span className="mono text-[10.5px] text-muted truncate hidden sm:inline">{s.host}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px]">
                    {s.ip && !s.fallback ? (
                      <>
                        <span className="text-muted">{s.country || "??"}</span>
                        <span className="mono">{s.ip}</span>
                      </>
                    ) : s.status === "ok" ? (
                      <span className="text-muted">{t.noIp}</span>
                    ) : s.status === "failed" ? (
                      <span style={{ color: "var(--bad)" }}>{t.unreachable}</span>
                    ) : (
                      <span className="text-muted">{t.pending}</span>
                    )}
                    {s.status === "ok" && s.ms ? <span className="text-muted tabular-nums w-14 text-right">{s.ms} ms</span> : <span className="w-14" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10.5px] text-muted mt-3 leading-relaxed">
        {t.footnote.replace("{ok}", String(reachable)).replace("{total}", String(sites.length)).replace("{traced}", String(traced))}
      </p>
    </div>
  );
}
