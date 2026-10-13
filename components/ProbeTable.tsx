"use client";
// Anthropic 三域名连通性探测表
import type { TraceProbe } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

function StatusIcon({ status }: { status: TraceProbe["status"] }) {
  if (status === "pending") return <span className="typing-dots" style={{ color: "var(--muted)" }}><i /><i /><i /></span>;
  if (status === "ok") return <CheckCircle2 size={15} style={{ color: "var(--good)" }} />;
  return <XCircle size={15} style={{ color: "var(--bad)" }} />;
}

export default function ProbeTable({ probes, t }: { probes: TraceProbe[]; t: any }) {
  return (
    <div className="divide-y divide-line">
      {probes.map((p) => (
        <div key={p.host} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <StatusIcon status={p.status} />
            <div className="min-w-0">
              <div className="mono text-[13px] truncate">{p.host}</div>
              <div className="text-[11px] text-muted truncate">
                {p.status === "pending" ? t.pending : p.status === "failed" ? t.unreachable : p.ip ? `${p.country || "??"} · ${p.colo || "—"} · ${p.warp === "on" || p.warp === "plus" ? t.warpOn : t.warpOff}` : t.reachable + (p.fallback ? " (probe)" : "")}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            {p.ip ? <div className="mono text-xs">{p.ip}</div> : null}
            {p.status === "ok" && p.ms ? <div className="text-[11px] text-muted">{p.ms} ms</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
