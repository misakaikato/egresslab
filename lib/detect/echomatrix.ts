// 出口矩阵:多站点回显 + 按出口分组 + 3 次采样中位延迟
export interface EchoSiteResult {
  name: string;
  kind: "cn" | "global";
  ip: string;
  medianMs: number | null;
}

export interface EchoMatrix {
  sites: EchoSiteResult[];
  groups: { ip: string; sites: string[] }[];
}

const SITES: { name: string; url: string; kind: "cn" | "global"; json?: boolean }[] = [
  { name: "124.222.230.137", url: "https://124.222.230.137/", kind: "cn", json: true },
  { name: "cnip.pancdn.net", url: "https://cnip.pancdn.net/", kind: "cn", json: true },
  { name: "api.ipify.org", url: "https://api.ipify.org/", kind: "global" },
  { name: "api64.ipify.org", url: "https://api64.ipify.org/", kind: "global" },
  { name: "ipwho.is", url: "https://ipwho.is/", kind: "global", json: true },
  { name: "ipv4.icanhazip.com", url: "https://ipv4.icanhazip.com/", kind: "global" },
  { name: "ipv6.icanhazip.com", url: "https://ipv6.icanhazip.com/", kind: "global" },
];

async function once(url: string, json: boolean | undefined): Promise<{ ip: string; ms: number } | null> {
  const t0 = performance.now();
  try {
    const r = await fetch(url, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(7000) });
    const text = await r.text();
    let ip = text.trim();
    if (json) {
      try {
        ip = String(JSON.parse(text)?.ip || "").trim();
      } catch {}
    }
    const m = ip.includes(":") ? /\b[0-9a-f:]+:[0-9a-f:]+\b/i.exec(ip) : /\b\d{1,3}(?:\.\d{1,3}){3}\b/.exec(ip);
    if (!m) return null;
    return { ip: m[0], ms: Math.round(performance.now() - t0) };
  } catch {
    return null;
  }
}

export async function runEchoMatrix(): Promise<EchoMatrix> {
  const sites = await Promise.all(
    SITES.map(async (s) => {
      const rounds: { ip: string; ms: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const r = await once(s.url, s.json);
        if (r) rounds.push(r);
      }
      if (!rounds.length) return { name: s.name, kind: s.kind, ip: "", medianMs: null };
      const times = rounds.map((r) => r.ms).sort((a, b) => a - b);
      return { name: s.name, kind: s.kind, ip: rounds[0].ip, medianMs: times[Math.floor(times.length / 2)] };
    })
  );
  const map = new Map<string, string[]>();
  for (const s of sites) {
    if (!s.ip) continue;
    map.set(s.ip, [...(map.get(s.ip) || []), s.name]);
  }
  return { sites, groups: [...map.entries()].map(([ip, names]) => ({ ip, sites: names })) };
}
