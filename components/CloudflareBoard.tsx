"use client";
// Cloudflare 专项看板:多 host /cdn-cgi/trace 对比 + Turnstile/reCAPTCHA 实测
import { useCallback, useEffect, useState } from "react";
import { CF_HOSTS, probeCfTrace, type CfTrace } from "@/lib/detect/cftrace";
import { coloToCity, coloToCountry } from "@/lib/colos";
import TurnstileCard from "./TurnstileCard";
import RecaptchaCard from "./RecaptchaCard";
import { RefreshCw } from "lucide-react";

function Cell({ v }: { v: string }) {
  return <td className="px-2.5 py-2 font-mono text-[11.5px] whitespace-nowrap">{v || <span className="text-muted">—</span>}</td>;
}

export default function CloudflareBoard({ t }: { t: any }) {
  const [rows, setRows] = useState<Map<string, CfTrace>>(new Map());
  const [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState<{ turnstile: string | null; recaptcha: string | null }>({ turnstile: null, recaptcha: null });

  const run = useCallback(async () => {
    setBusy(true);
    setRows(new Map());
    await Promise.all(
      CF_HOSTS.map(async (h) => {
        const r = await probeCfTrace(h.host);
        setRows((m) => new Map(m).set(h.host, r));
      })
    );
    setBusy(false);
  }, []);

  useEffect(() => {
    void run();
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCfg({ turnstile: j?.turnstile || null, recaptcha: j?.recaptcha || null }))
      .catch(() => {});
  }, [run]);

  const done = CF_HOSTS.map((h) => rows.get(h.host)).filter((r): r is CfTrace => !!r && r.ok);
  const ips = new Set(done.map((r) => r.ip));
  const colos = new Set(done.map((r) => r.colo));
  const sameIp = done.length > 1 && ips.size === 1;
  const sameColo = done.length > 1 && colos.size === 1;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2.5">
            <b className="text-[14px]">{t.matrixTitle}</b>
            <span className="text-[11px] text-muted">{done.length}/{CF_HOSTS.length}</span>
          </div>
          <button onClick={() => void run()} disabled={busy} className="pill card-hover cursor-pointer text-[11px] flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={11} className={busy ? "animate-spin" : ""} />
            {t.refresh}
          </button>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10.5px] text-muted uppercase tracking-wide border-b border-line">
                <th className="px-2.5 py-1.5 font-medium">{t.col.site}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.ip}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.colo}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.loc}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.warp}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.http}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.tls}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.sni}</th>
                <th className="px-2.5 py-1.5 font-medium">{t.col.kex}</th>
                <th className="px-2.5 py-1.5 font-medium text-right">{t.col.ms}</th>
              </tr>
            </thead>
            <tbody>
              {CF_HOSTS.map((h) => {
                const r = rows.get(h.host);
                return (
                  <tr key={h.host} className="border-b border-line/50 last:border-0">
                    <td className="px-2.5 py-2 text-[12px] font-medium whitespace-nowrap">
                      {h.label}
                      <span className="block text-[10px] text-muted font-normal">{h.host}</span>
                    </td>
                    {!r ? (
                      <td colSpan={9} className="px-2.5 py-2 text-[11.5px] text-muted">{t.probing}</td>
                    ) : !r.ok ? (
                      <td colSpan={9} className="px-2.5 py-2 text-[11.5px]" style={{ color: "var(--bad)" }}>{t.failed}</td>
                    ) : (
                      <>
                        <Cell v={r.ip} />
                        <td className="px-2.5 py-2 text-[11.5px] whitespace-nowrap">
                          <b className="font-mono">{r.colo}</b>
                          {coloToCity(r.colo) ? <span className="text-muted"> {coloToCity(r.colo)}</span> : null}
                        </td>
                        <td className="px-2.5 py-2 text-[11.5px] font-mono whitespace-nowrap">
                          {r.loc}
                          {r.colo && coloToCountry(r.colo) && coloToCountry(r.colo) !== r.loc ? (
                            <span className="ml-1 text-[10px]" style={{ color: "var(--warn)" }} title={t.locMismatch}>≠colo</span>
                          ) : null}
                        </td>
                        <Cell v={r.warp} />
                        <Cell v={r.http} />
                        <Cell v={r.tls} />
                        <Cell v={r.sni} />
                        <Cell v={r.kex} />
                        <td className="px-2.5 py-2 text-[11.5px] font-mono text-right">{r.ms}ms</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {done.length > 1 ? (
          <div className="mt-3 pt-3 border-t border-line text-[12px] space-y-1">
            <div>
              {t.consistencyIp}:{" "}
              <b style={{ color: sameIp ? "var(--good)" : "var(--warn)" }}>{sameIp ? t.consistent : t.inconsistent}</b>
              {!sameIp ? <span className="text-muted"> ({[...ips].join(", ")})</span> : null}
            </div>
            <div>
              {t.consistencyColo}:{" "}
              <b style={{ color: sameColo ? "var(--good)" : "var(--warn)" }}>{sameColo ? t.consistent : t.inconsistent}</b>
              {!sameColo ? <span className="text-muted"> ({[...colos].join(", ")})</span> : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TurnstileCard sitekey={cfg.turnstile} t={t.turnstile} />
        {cfg.recaptcha ? <RecaptchaCard sitekey={cfg.recaptcha} t={t.recaptcha} /> : null}
      </div>
    </div>
  );
}
