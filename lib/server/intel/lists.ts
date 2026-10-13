// 静态名单:Tor 出口(文件优先,在线兜底,24h 缓存)
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getDb, dbTry } from "../db";

const TOR_FILE = path.join(process.cwd(), "data", "lists", "tor-exits.txt");
const TOR_URL = "https://check.torproject.org/torbulkexitlist";
const FIREHOL_URL = "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset";

let fireholRanges: [number, number][] | null = null;

function v4ToLong(ip: string): number {
  return ip.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
}

export function inFirehol(ip: string): boolean | null {
  if (ip.includes(":")) return false;
  if (!fireholRanges) return null;
  const x = v4ToLong(ip);
  let lo = 0, hi = fireholRanges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [s, e] = fireholRanges[mid];
    if (x < s) hi = mid - 1;
    else if (x > e) lo = mid + 1;
    else return true;
  }
  return false;
}

export async function loadFirehol(): Promise<boolean> {
  if (fireholRanges) return true;
  const d = getDb();
  const now = Date.now();
  const row = dbTry(
    () => d.prepare("SELECT ts, json FROM intel_cache WHERE key='firehol-level1'").get() as { ts: number; json: string } | undefined,
    undefined
  );
  let ranges: [number, number][] = [];
  if (row && now - row.ts < 24 * 3600 * 1000) {
    try { ranges = JSON.parse(row.json); } catch {}
  }
  if (!ranges.length) {
    try {
      const res = await fetch(FIREHOL_URL, { signal: AbortSignal.timeout(20000), cache: "no-store" });
      const text = await res.text();
      ranges = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#") && /^\d+\.\d+\.\d+\.\d+\/(\d+)$/.test(l))
        .map((cidr) => {
          const [base, bits] = cidr.split("/");
          const b = Number(bits);
          const mask = b === 0 ? 0 : (0xffffffff << (32 - b)) >>> 0;
          const start = (v4ToLong(base) & mask) >>> 0;
          const end = (start | (~mask >>> 0)) >>> 0;
          return [start, end] as [number, number];
        })
        .sort((a, b) => a[0] - b[0]);
      dbTry(() => {
        d.prepare("INSERT INTO intel_cache(key,ts,ttl_ms,json) VALUES('firehol-level1',?,86400000,?) ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, json=excluded.json").run(now, JSON.stringify(ranges));
      }, undefined);
    } catch {
      return false;
    }
  }
  fireholRanges = ranges;
  return true;
}

export async function getTorSet(): Promise<Set<string>> {
  if (existsSync(TOR_FILE)) {
    try {
      return new Set(readFileSync(TOR_FILE, "utf8").split("\n").map((l) => l.trim()).filter(Boolean));
    } catch {}
  }
  const row = dbTry(
    () => getDb().prepare("SELECT ts, json FROM intel_cache WHERE key='tor-list'").get() as { ts: number; json: string } | undefined,
    undefined
  );
  const now = Date.now();
  if (row && now - row.ts < 24 * 3600 * 1000) {
    try { return new Set(JSON.parse(row.json) as string[]); } catch {}
  }
  try {
    const res = await fetch(TOR_URL, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    const text = await res.text();
    const list = text.split("\n").map((l) => l.trim()).filter((l) => /^\d+\.\d+\.\d+\.\d+$/.test(l));
    dbTry(() => {
      const d = getDb();
      d.prepare("INSERT INTO intel_cache(key,ts,ttl_ms,json) VALUES('tor-list',?,86400000,?) ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, json=excluded.json").run(now, JSON.stringify(list));
    }, undefined);
    return new Set(list);
  } catch {
    return new Set();
  }
}
