"use client";
// WHOIS/RDAP 查询面板:输入域名 / IP / ASN,结构化展示
import { useCallback, useState } from "react";
import type { RdapResult } from "@/lib/server/rdap";
import { Search } from "lucide-react";

const EV_LABEL: Record<string, string> = {
  registration: "reg", expiration: "exp", "last changed": "changed", "last update of RDAP database": "rdapUpdate",
};

export default function WhoisPanel({ t }: { t: any }) {
  const [q, setQ] = useState("");
  const [r, setR] = useState<RdapResult | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setBusy(true);
    setR(null);
    try {
      const res = await fetch(`/api/whois?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      setR((await res.json()) as RdapResult);
    } catch {
      setR({ kind: "domain", query, ok: false, error: "network" });
    }
    setBusy(false);
  }, []);

  return (
    <div className="space-y-4">
      <form
        className="card p-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 bg-transparent outline-none text-[14px] font-mono placeholder:text-muted/60"
          spellCheck={false}
          autoCapitalize="off"
        />
        <button type="submit" disabled={busy || !q.trim()} className="pill card-hover cursor-pointer text-[12px] flex items-center gap-1.5 disabled:opacity-50">
          <Search size={12} className={busy ? "animate-pulse" : ""} />
          {t.query}
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {(t.examples as string[]).map((ex) => (
          <button key={ex} onClick={() => { setQ(ex); void run(ex); }} className="pill card-hover cursor-pointer text-[11px] font-mono">{ex}</button>
        ))}
      </div>

      {r ? (
        <div className="card p-5 fade-in">
          {!r.ok ? (
            <div className="text-[13px]" style={{ color: "var(--bad)" }}>{(t.err as any)[r.error || "network"] || r.error}</div>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5 mb-3 flex-wrap">
                <b className="text-[16px] font-mono">{r.name || r.query}</b>
                <span className="pill text-[10.5px]">{(t.kind as any)[r.kind]}</span>
                {r.handle && r.handle !== r.name ? <span className="text-[11px] text-muted font-mono">{r.handle}</span> : null}
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
                {r.kind !== "domain" && r.startAddress ? (
                  <div><span className="text-muted">{t.range}: </span><span className="font-mono">{r.startAddress} – {r.endAddress}</span></div>
                ) : null}
                {r.country ? <div><span className="text-muted">{t.country}: </span>{r.country}</div> : null}
                {r.type ? <div><span className="text-muted">{t.typeLabel}: </span>{r.type}</div> : null}
                {(r.events || []).map((e, i) => (
                  <div key={i}>
                    <span className="text-muted">{(t.events as any)[EV_LABEL[e.action] || e.action] || e.action}: </span>
                    {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                  </div>
                ))}
                {(r.status || []).length ? (
                  <div className="sm:col-span-2"><span className="text-muted">{t.statusLabel}: </span>{r.status!.join(", ")}</div>
                ) : null}
                {(r.nameservers || []).length ? (
                  <div className="sm:col-span-2"><span className="text-muted">NS: </span><span className="font-mono">{r.nameservers!.join("  ·  ")}</span></div>
                ) : null}
              </div>
              {(r.entities || []).length ? (
                <div className="mt-3 pt-3 border-t border-line">
                  <div className="text-[11px] text-muted mb-1.5">{t.entities}</div>
                  <div className="space-y-1">
                    {r.entities!.map((e, i) => (
                      <div key={i} className="text-[12px] flex gap-2 flex-wrap">
                        <span className="font-medium">{e.fn || e.handle || "—"}</span>
                        {e.fn && e.handle ? <span className="text-muted font-mono">{e.handle}</span> : null}
                        <span className="text-muted">{e.roles.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
