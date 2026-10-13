// DNS 一致性检测:DoH 双源解析 Anthropic 域名,比对 Cloudflare 官方 IP 段
// 出界 IP = 污染/劫持信号(浏览器端可实现的最接近 DNS 泄漏的检测)
export interface DnsCheck {
  status: "ok" | "partial" | "failed";
  providers: string[];
  polluted: boolean | null; // true=解析出 CF 段外地址
  outOfRange: string[]; // 出界样本
  sampled: string[]; // 正常样本(最多 4 个)
}

// Cloudflare 官方公布段(www.cloudflare.com/ips-v4 / ips-v6,静态内嵌)
const CF_V4 = ["173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"];
const CF_V6 = ["2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"];

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
}
function inV4(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (0xffffffff << (32 - Number(bits))) >>> 0;
  return (v4ToInt(ip) & mask) === (v4ToInt(base) & mask);
}
function ipv6ToBigInt(ip: string): bigint {
  const parts = ip.split("::");
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length > 1 && parts[1] ? parts[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  const segs = [...head, ...Array(Math.max(0, missing)).fill("0"), ...tail];
  return segs.slice(0, 8).reduce((a, s) => (a << 16n) + BigInt(parseInt(s || "0", 16)), 0n);
}
function inV6(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const b = BigInt(bits);
  const mask = b === 0n ? 0n : ((1n << b) - 1n) << (128n - b);
  return (ipv6ToBigInt(ip) & mask) === (ipv6ToBigInt(base) & mask);
}
export function isCloudflareIp(ip: string): boolean {
  return ip.includes(":") ? CF_V6.some((c) => inV6(ip, c)) : CF_V4.some((c) => inV4(ip, c));
}

const PROVIDERS: { name: string; url: (h: string) => string }[] = [
  { name: "dns.google", url: (h) => `https://dns.google/resolve?name=${h}&type=A` },
  { name: "cloudflare-dns.com", url: (h) => `https://cloudflare-dns.com/dns-query?name=${h}&type=A` },
];

async function dohFetch(url: string): Promise<string[]> {
  const res = await fetch(url, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(7000), headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return ((j?.Answer as any[]) || []).filter((a) => a.type === 1).map((a) => String(a.data));
}

export async function checkDns(hosts: string[] = ["claude.ai", "api.anthropic.com"]): Promise<DnsCheck> {
  const out: DnsCheck = { status: "failed", providers: [], polluted: null, outOfRange: [], sampled: [] };
  let okProviders = 0;
  for (const p of PROVIDERS) {
    let ok = false;
    for (const h of hosts) {
      try {
        const ips = await dohFetch(p.url(h));
        if (ips.length) {
          ok = true;
          out.providers.push(p.name);
          for (const ip of ips) {
            if (isCloudflareIp(ip)) {
              if (out.sampled.length < 4) out.sampled.push(ip);
            } else {
              out.polluted = true;
              if (out.outOfRange.length < 4) out.outOfRange.push(`${h} → ${ip}`);
            }
          }
        }
      } catch {}
    }
    if (ok) okProviders++;
  }
  if (okProviders === PROVIDERS.length) out.status = "ok";
  else if (okProviders > 0) out.status = "partial";
  if (out.polluted === null && okProviders > 0) out.polluted = false;
  return out;
}
