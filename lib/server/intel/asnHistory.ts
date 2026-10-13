// ASN 路由历史(RIPEstat routing-history,免费):该前缀的宣告变迁
import { jsonFetch } from "./geo";

export interface AsnEvent {
  origin: string;
  start: string;
  end: string | null; // null = 至今
  peers: number;
}

export async function asnHistory(ip: string): Promise<{ prefix: string; events: AsnEvent[] } | null> {
  try {
    const af = ip.includes(":") ? 6 : 4;
    const j = await jsonFetch(`https://stat.ripe.net/data/routing-history/data.json?resource=${encodeURIComponent(ip)}&likeness=prefix&af=${af}`, 15000);
    const byOrigin: any[] = j?.data?.by_origin || [];
    const events: AsnEvent[] = [];
    for (const group of byOrigin) {
      const origin = String(group?.origin || "");
      for (const pfx of group?.prefixes || []) {
        for (const tl of pfx?.timelines || []) {
          if (typeof tl?.starttime === "string") {
            events.push({
              origin,
              start: tl.starttime.slice(0, 10),
              end: typeof tl.endtime === "string" && tl.endtime ? tl.endtime.slice(0, 10) : null,
              peers: Number(tl?.full_peers_seeing) || 0,
            });
          }
        }
      }
    }
    events.sort((a, b) => (a.start < b.start ? -1 : 1));
    const prefix = j?.data?.resource || byOrigin[0]?.prefixes?.[0]?.prefix || "";
    if (!events.length) return null;
    return { prefix, events: events.slice(-14) };
  } catch {
    return null;
  }
}
