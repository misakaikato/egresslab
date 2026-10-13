// 多源直连回显:交叉验证分流(浏览器视角的"每个站点看到的你是谁")
export interface EchoResult {
  ip: string;
  via: string;
  kind: "cn" | "global";
}

const ECHO_ENDPOINTS: { url: string; kind: "cn" | "global" }[] = [
  { url: "https://124.222.230.137/", kind: "cn" },
  { url: "https://cnip.pancdn.net/", kind: "cn" },
  { url: "https://api.ipify.org/?format=json", kind: "global" },
  { url: "https://ipwho.is/", kind: "global" },
];

async function fetchEcho(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    return String(j?.ip || "").trim();
  } catch {
    // 纯文本回显(如 ipw.cn 风格)
    const m = /\b(\d{1,3}(?:\.\d{1,3}){3})\b/.exec(text);
    return m ? m[1] : "";
  }
}

export async function probeDirectAll(timeoutMs = 9000): Promise<EchoResult[]> {
  const results = await Promise.allSettled(
    ECHO_ENDPOINTS.map(async (e) => {
      const ip = await fetchEcho(e.url, timeoutMs);
      if (!ip) throw new Error("no ip");
      return { ip, via: new URL(e.url).hostname, kind: e.kind } as EchoResult;
    })
  );
  return results.filter((r): r is PromiseFulfilledResult<EchoResult> => r.status === "fulfilled").map((r) => r.value);
}

export function distinctExits(echos: EchoResult[]): string[] {
  return Array.from(new Set(echos.map((e) => e.ip).filter(Boolean)));
}

// 兼容旧调用:主出口(首个 CN 源优先)
export async function probeDirect(timeoutMs = 9000): Promise<{ ip: string; via: string; exits: EchoResult[] }> {
  const exits = await probeDirectAll(timeoutMs);
  const primary = exits.find((e) => e.kind === "cn") || exits[0] || { ip: "", via: "" };
  return { ip: primary.ip, via: primary.via, exits };
}

// ---- 出口国家切换历史(浏览器本地) ----
export interface ExitEntry {
  ip: string;
  country: string;
  ts: number;
}
export interface HistoryVerdict {
  entries: ExitEntry[];
  switches24h: number;
  switches7d: number;
  trail: string[]; // 最近国家轨迹(新→旧,去重相邻)
}

const LS_KEY = "egresslab:exit-history";

export function loadHistory(): ExitEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as ExitEntry[]) : [];
    return Array.isArray(arr) ? arr.slice(-30) : [];
  } catch {
    return [];
  }
}

export function recordExit(ip: string, country: string): HistoryVerdict {
  const now = Date.now();
  const prev = loadHistory();
  const last = prev[prev.length - 1];
  const entries = last && last.ip === ip && last.country === country ? [...prev.slice(0, -1), { ip, country, ts: now }] : [...prev, { ip, country, ts: now }].slice(-30);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {}
  const inWindow = (ms: number) => entries.filter((e) => now - e.ts <= ms);
  const countSwitches = (list: ExitEntry[]) => {
    let n = 0;
    for (let i = 1; i < list.length; i++) if (list[i].country !== list[i - 1].country) n++;
    return n;
  };
  const trailRaw = [...entries].reverse().map((e) => e.country || "??");
  const trail: string[] = [];
  for (const c of trailRaw) if (trail[0] !== c) trail.push(c);
  return { entries, switches24h: countSwitches(inWindow(86400_000)), switches7d: countSwitches(inWindow(7 * 86400_000)), trail: trail.slice(0, 4) };
}
