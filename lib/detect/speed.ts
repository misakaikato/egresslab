// Cloudflare 测速(官方 speed.cloudflare.com,CORS 全开)+ Globalping 入站延迟
export interface SpeedResult {
  downMbps: number | null;
  upMbps: number | null;
  latencyMs: number | null; // 到 CF 边缘
  globalPing: { loc: string; ms: number | null }[];
}

async function timeOnce(bytes: number): Promise<number> {
  const t0 = performance.now();
  const r = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
  await r.arrayBuffer();
  return performance.now() - t0;
}

export async function edgeLatency(): Promise<number | null> {
  const times: number[] = [];
  for (let i = 0; i < 3; i++) {
    try {
      times.push(await timeOnce(1000));
    } catch {}
  }
  if (!times.length) return null;
  times.sort((a, b) => a - b);
  return Math.round(times[Math.floor(times.length / 2)]);
}

// CF 专用端点失败(部分分流网络会重置该域名)时回退 jsDelivr CDN(CORS ✓)
export async function downSpeed(bytes = 20_000_000): Promise<{ mbps: number | null; via: string | null }> {
  const r1 = await downVia(`https://speed.cloudflare.com/__down?bytes=${bytes}`, bytes);
  if (r1 !== null) return { mbps: r1, via: "speed.cloudflare.com" };
  const r2 = await downVia(`https://cdn.jsdelivr.net/gh/lionsoul2014/ip2region@master/data/ip2region_v4.xdb?cb=${Date.now()}`, 11_000_000);
  if (r2 !== null) return { mbps: r2, via: "jsDelivr CDN" };
  return { mbps: null, via: null };
}

async function downVia(url: string, bytes: number): Promise<number | null> {
  try {
    const t0 = performance.now();
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30000) });
    const reader = r.body?.getReader();
    if (!reader) {
      await r.arrayBuffer();
    } else {
      for (;;) {
        const { done } = await reader.read();
        if (done) break;
      }
    }
    const sec = (performance.now() - t0) / 1000;
    return sec > 0 ? Math.round(((bytes * 8) / sec) / 1_000_000) : null;
  } catch {
    return null;
  }
}

export async function upSpeed(bytes = 4_000_000): Promise<number | null> {
  try {
    const blob = new Blob([new Uint8Array(bytes)]);
    const t0 = performance.now();
    await fetch("https://speed.cloudflare.com/__up", { method: "POST", body: blob, cache: "no-store", signal: AbortSignal.timeout(30000) });
    const sec = (performance.now() - t0) / 1000;
    return sec > 0 ? Math.round(((bytes * 8) / sec) / 1_000_000) : null;
  } catch {
    return null;
  }
}

// 全球探针 → 目标 IP 的入站延迟(Globalping 免费无 key)
export async function globalPing(targetIp: string): Promise<{ loc: string; ms: number | null }[]> {
  const locations = ["Hong Kong", "Tokyo", "Singapore", "Frankfurt", "London", "New York"];
  try {
    const res = await fetch("https://api.globalping.io/v1/measurements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target: targetIp, type: "ping", locations: locations.map((l) => ({ magic: l })), limit: 6, measurementOptions: { packets: 3 } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    let m = await res.json();
    for (let i = 0; i < 10 && m?.status === "in-progress"; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      m = await fetch(`https://api.globalping.io/v1/measurements/${m.id}`, { signal: AbortSignal.timeout(10000) }).then((r) => r.json());
    }
    if (!Array.isArray(m?.results)) return [];
    return m.results.map((r: any) => {
      const avg = r?.result?.avg ?? r?.result?.stats?.avg;
      const p = r?.probe || {};
      return { loc: String(p.city || p.country || p.network || "?"), ms: typeof avg === "number" ? Math.round(avg) : null };
    });
  } catch {
    return [];
  }
}
