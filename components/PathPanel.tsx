"use client";
// 出口路径面板:浏览器双栈 / 直连 / Anthropic 出口 / 一致性对照
import type { TraceProbe, IntelResult } from "@/lib/types";
import { StackInfo } from "@/lib/detect/dualstack";
import { distinctExits, type EchoResult, type HistoryVerdict } from "@/lib/detect/direct";
import type { DnsCheck } from "@/lib/detect/dns";
import type { DnsLeakResult } from "@/lib/detect/dnsleak";

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "muted" }) {
  const color = tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : tone === "muted" ? "var(--muted)" : "var(--ink)";
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="mono text-[12.5px] text-right truncate" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function PathPanel({
  t,
  claude,
  direct,
  v4,
  v6,
  intel,
  browserTz,
  dns,
  history,
  dnsLeak,
}: {
  t: any;
  claude: TraceProbe | undefined;
  direct: { ip: string; via: string; exits: EchoResult[] };
  v4: StackInfo | null;
  v6: StackInfo | null;
  intel: IntelResult | null;
  browserTz: string;
  dns: DnsCheck | null;
  history: HistoryVerdict | null;
  dnsLeak: DnsLeakResult | null;
}) {
  const exits = claude?.ip || intel?.ip;
  const distinct = distinctExits(direct.exits);
  const all = [v4?.ip, v6?.ip, ...distinct, claude?.ip].filter(Boolean);
  const sameAll = all.length >= 2 && new Set(all).size === 1;
  return (
    <div>
      <Row label={t.browserV4} value={v4 ? `${v4.ip} (${v4.country || "??"})` : t.none} tone={v4 ? undefined : "muted"} />
      <Row label={t.browserV6} value={v6 ? `${v6.ip} (${v6.country || "??"})` : t.none} tone={v6 ? undefined : "muted"} />
      <Row
        label={t.direct}
        value={direct.exits.length ? (distinct.length > 1 ? `${distinct.join(" · ")}` : `${direct.ip} ${direct.via ? `${t.via} ${direct.via}` : ""}`) : t.none}
        tone={distinct.length > 1 ? "bad" : direct.ip ? undefined : "muted"}
      />
      <Row label={t.anthropic} value={claude?.ip ? `${claude.ip} (${claude.country || "??"})` : claude?.status === "failed" ? t.none : t.pending} />
      <div className="my-2 border-t border-dashed border-line" />
      <Row label={t.ipGeo} value={intel?.geo?.country_code ? `CF: ${claude?.country || "—"} / DB: ${intel.geo.country_code}` : t.pending} tone={intel?.geo?.country_code && claude?.country && intel.geo.country_code === claude.country ? "good" : undefined} />
      <Row
        label={t.family}
        value={v4?.country && v6?.country ? (v4.country === v6.country ? `${v4.country} = ${v6.country}` : `${v4.country} ≠ ${v6.country}`) : v4 ? t.only4 : v6 ? t.only6 : t.pending}
        tone={v4?.country && v6?.country ? (v4.country === v6.country ? "good" : "bad") : "muted"}
      />
      <Row
        label={t.route}
        value={exits && distinct.length ? (distinct.length > 1 ? `${distinct.length} ${t.exitsCount}` : distinct[0] === claude?.ip ? t.same : t.diff) : t.pending}
        tone={exits && distinct.length ? (distinct.length > 1 ? "bad" : distinct[0] === claude?.ip ? "good" : "bad") : "muted"}
      />
      <Row
        label={t.netClass || "Net"}
        value={(() => {
          const nt = String(intel?.network?.asn_type || "?");
          const pdb = String(intel?.network?.pdb_type || "").replace(/\?$/, "");
          const ntZh = (t.netTypes && t.netTypes[nt]) || nt;
          const pdbZh = pdb ? (t.pdbTypes && t.pdbTypes[pdb]) || pdb : "";
          return pdb ? `${ntZh}(${pdbZh})` : ntZh;
        })()}
        tone={["residential", "mobile", "isp"].includes(String(intel?.network?.asn_type)) ? "good" : ["hosting", "transit", "cdn"].includes(String(intel?.network?.asn_type)) ? "bad" : undefined}
      />
      <Row label={t.native} value={intel?.network?.native === true ? t.nativeYes : intel?.network?.native === false ? t.nativeNo : t.pending} tone={intel?.network?.native === true ? "good" : intel?.network?.native === false ? "bad" : "muted"} />
      <Row label={t.timezone} value={browserTz ? `${browserTz} / ${intel?.geo?.timezone || "?"}` : t.pending} />
      {all.length >= 2 ? <Row label="Σ" value={sameAll ? t.same : t.diff} tone={sameAll ? "good" : "bad"} /> : null}
      <div className="my-2 border-t border-dashed border-line" />
      <Row
        label={t.dns}
        value={!dns ? t.pending : dns.status === "failed" ? t.dnsFailed : dns.polluted ? `${t.dnsPolluted}: ${dns.outOfRange[0] || ""}` : dns.status === "partial" ? t.dnsPartial : `${t.dnsOk} (${dns.providers.join(" · ")})`}
        tone={dns?.polluted ? "bad" : dns && dns.status !== "failed" ? "good" : "muted"}
      />
      <Row
        label={t.ptr}
        value={intel?.network?.ptr ? (intel.network.ptr.host ? `${intel.network.ptr.host}${intel.network.ptr.match === false ? " ✗" : ""}` : t.ptrNone) : t.pending}
        tone={intel?.network?.ptr?.match === false ? "bad" : "muted"}
      />
      <Row
        label={t.prefix}
        value={intel?.risk?.prefix_first_seen ? String(intel.risk.prefix_first_seen).slice(0, 10) : t.pending}
        tone={intel?.risk?.prefix_first_seen ? (Date.now() - new Date(intel.risk.prefix_first_seen).getTime() < 90 * 86400_000 ? "bad" : undefined) : "muted"}
      />
      <Row
        label={t.neighbors}
        value={typeof intel?.risk?.neighbors_flagged === "number" ? `${intel.risk.neighbors_flagged} / 2` : t.pending}
        tone={(intel?.risk?.neighbors_flagged ?? 0) > 0 ? "bad" : "muted"}
      />
      <div className="my-2 border-t border-dashed border-line" />
      {history ? (
        <>
          <Row label={t.h24} value={`${history.switches24h} ${t.times}`} tone={history.switches24h > 0 ? "bad" : "good"} />
          <Row label={t.h7d} value={`${history.switches7d} ${t.times}`} tone={history.switches7d > 0 ? "bad" : "good"} />
          <Row label={t.trail} value={history.trail.join(" → ") || "—"} tone="muted" />
        </>
      ) : null}
      {dnsLeak?.available ? (
        <Row
          label={t.dnsleak}
          value={dnsLeak.resolvers.length ? dnsLeak.resolvers.map((r) => `${r.ip}(${r.country || "?"})`).join(" · ") : t.dnsleakNone}
          tone={dnsLeak.mismatch ? "bad" : dnsLeak.resolvers.length ? "good" : "muted"}
        />
      ) : null}
      <SafetyChips intel={intel} t={t.safety} />
    </div>
  );
}

function SafetyChips({ intel, t }: { intel: IntelResult | null; t: any }) {
  if (!intel || !intel.risk || !t) return null;
  const r = intel.risk;
  const dc = r.is_datacenter;
  const bad = r.is_tor || r.is_proxy || r.is_residential_proxy;
  const flagged = (r.abuse_score ?? 0) >= 30 || (r.blacklist_score ?? 0) >= 50;
  const tier = (v: "risk" | "caution" | "safe") => v;
  const ai = bad ? tier("risk") : dc || r.is_vpn ? tier("caution") : flagged ? tier("caution") : tier("safe");
  const media = r.is_tor ? tier("risk") : dc ? tier("caution") : tier("safe");
  const signup = flagged || bad ? tier("risk") : dc ? tier("caution") : tier("safe");
  const COLOR: Record<string, string> = { safe: "var(--good)", caution: "var(--warn)", risk: "var(--bad)" };
  const items: [string, string][] = [[t.ai, ai], [t.media, media], [t.signup, signup]];
  return (
    <div className="mt-3 pt-3 border-t border-line">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted">{t.title}:</span>
        {items.map(([label, v]) => (
          <span key={label} className="pill border-0" style={{ background: `color-mix(in srgb, ${COLOR[v]} 12%, transparent)`, color: COLOR[v] }}>
            {label} · {t[v]}
          </span>
        ))}
      </div>
      <p className="text-[10.5px] text-muted mt-1.5">{t.note}</p>
    </div>
  );
}
