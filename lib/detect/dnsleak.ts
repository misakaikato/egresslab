// 真 DNS 泄漏检测(需部署 dnsleak-server 并配置 DNSLEAK_ZONE/DNSLEAK_API):
// 触发随机子域名解析 → 观察者记录「哪个递归解析器来查」→ 与浏览器出口比对
export interface DnsLeakResolver {
  ip: string;
  country: string;
}

export interface DnsLeakResult {
  available: boolean;
  zone?: string;
  resolvers: DnsLeakResolver[];
  exitCountry?: string;
  mismatch: boolean | null; // true=解析器与出口不同国(泄漏)
}

export interface DnsLeakConfig {
  zone: string;
  api: string;
}

export async function getDnsLeakConfig(): Promise<DnsLeakConfig | null> {
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    const j = await r.json();
    return j?.dnsleak?.zone && j?.dnsleak?.api ? { zone: j.dnsleak.zone, api: j.dnsleak.api } : null;
  } catch {
    return null;
  }
}

function randToken(): string {
  return Math.random().toString(16).slice(2, 10);
}

async function resolverCountry(ip: string): Promise<string> {
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    return String(j?.country_code || "").toUpperCase();
  } catch {
    return "";
  }
}

export async function runDnsLeak(exitCountry: string): Promise<DnsLeakResult> {
  const cfg = await getDnsLeakConfig();
  if (!cfg) return { available: false, resolvers: [], mismatch: null };
  const token = randToken();
  // 三轮触发解析(http no-cors:DNS 会真实走系统递归,连接失败无所谓)
  for (let i = 0; i < 3; i++) {
    try {
      await fetch(`http://${token}-${i}.${cfg.zone}/`, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(4000) });
    } catch {}
    await new Promise((r) => setTimeout(r, 900));
  }
  // 轮询观察者
  let resolverIps: string[] = [];
  for (let t = 0; t < 3 && resolverIps.length === 0; t++) {
    await new Promise((r) => setTimeout(r, 1300));
    try {
      const r = await fetch(`${cfg.api}/hits/${token}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      const j = await r.json();
      resolverIps = Array.isArray(j?.resolvers) ? j.resolvers.slice(0, 5) : [];
    } catch {}
  }
  const resolvers: DnsLeakResolver[] = await Promise.all(
    resolverIps.map(async (ip) => ({ ip, country: await resolverCountry(ip) }))
  );
  const countries = new Set(resolvers.map((r) => r.country).filter(Boolean));
  const mismatch = resolvers.length
    ? exitCountry
      ? ![...countries].some((c) => c === exitCountry)
      : null
    : null;
  return { available: true, zone: cfg.zone, resolvers, exitCountry, mismatch };
}
