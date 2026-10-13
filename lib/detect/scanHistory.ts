// 本机检测历史:localStorage,最近 50 次
export interface ScanRecord {
  ts: number;
  score: number;
  level: string;
  gate: string | null;
  region: string;
  exitIp: string;
  headline: string;
  verdicts: string[];
  cnScore?: number;
}

const KEY = "egresslab:scan-history";
const MAX = 50;

export function loadScans(): ScanRecord[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr.slice(-MAX) : [];
  } catch {
    return [];
  }
}

export function saveScan(rec: ScanRecord): ScanRecord[] {
  const prev = loadScans();
  const list = [...prev, rec].slice(-MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  return list;
}
