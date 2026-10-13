"use client";
// 请求头回显(服务器所见)
import { useEffect, useState } from "react";
import { ListOrdered } from "lucide-react";

interface MeData {
  ip: string;
  headerOrder: string[];
  headers: Record<string, string>;
}

export default function HeadersCard({ t }: { t: any }) {
  const [data, setData] = useState<MeData | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && !data) {
      fetch("/api/me", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => j?.ok && setData(j))
        .catch(() => {});
    }
  }, [open, data]);
  return (
    <div className="card p-5">
      <button className="w-full text-left flex items-center gap-2" onClick={() => setOpen(!open)}>
        <ListOrdered size={14} className="text-accent" />
        <h3 className="text-sm font-semibold flex-1">{t.title}</h3>
        <span className="text-[11px] text-muted">{open ? t.collapse : t.expand}</span>
      </button>
      {open ? (
        data ? (
          <div className="mt-3 fade-in">
            <p className="text-[11px] text-muted mb-2">{t.desc}</p>
            <div className="space-y-1">
              {Object.entries(data.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[11.5px]">
                  <span className="mono text-muted shrink-0">{k}:</span>
                  <span className="mono text-soft break-all">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-muted mt-2 mono">{t.order}: {data.headerOrder.join(" → ")}</p>
          </div>
        ) : (
          <p className="text-xs text-muted mt-3">{t.loading}</p>
        )
      ) : null}
    </div>
  );
}
