// 蜜罐接口(预留):查询始终可用;上报需 X-Sensor-Key
import { getDb, dbTry } from "./db";

export interface HoneypotRecord {
  ok: boolean;
  ip: string;
  known: boolean;
  hits: number;
  first_seen: number | null;
  last_seen: number | null;
  types: string[];
}

export function queryHoneypot(ip: string): HoneypotRecord {
  const empty: HoneypotRecord = { ok: true, ip, known: false, hits: 0, first_seen: null, last_seen: null, types: [] };
  return dbTry(() => {
    const d = getDb();
    const row = d.prepare("SELECT COUNT(*) AS c, MIN(ts) AS f, MAX(ts) AS l FROM honeypot_hits WHERE src_ip=?").get(ip) as any;
    if (!row || !row.c) return empty;
    const types = (d.prepare("SELECT DISTINCT proto FROM honeypot_hits WHERE src_ip=?").all(ip) as any[]).map((r) => r.proto).filter(Boolean);
    return { ok: true, ip, known: true, hits: row.c, first_seen: row.f, last_seen: row.l, types };
  }, empty);
}

export function recordHit(srcIp: string, sensor: string, proto: string, detail: string) {
  dbTry(() => {
    getDb().prepare("INSERT INTO honeypot_hits(ts,src_ip,sensor,proto,detail) VALUES(?,?,?,?,?)")
      .run(Date.now(), srcIp, sensor, proto, detail);
  }, undefined);
}

export function sensorKeyConfigured(): boolean {
  return !!process.env.HONEYPOT_KEY;
}
export function sensorKeyMatches(provided: string | null): boolean {
  const key = process.env.HONEYPOT_KEY;
  return !!key && !!provided && provided === key;
}
