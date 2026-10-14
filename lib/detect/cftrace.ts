// Cloudflare /cdn-cgi/trace 全字段探测:比对多个 CF 站点的出口 IP / colo / 协议栈
"use client";

export interface CfTrace {
  host: string;
  ok: boolean;
  ms: number;
  ip: string;
  loc: string;
  colo: string;
  warp: string;
  http: string;
  tls: string;
  sni: string;
  kex: string;
  gateway: string;
  rbi: string;
}

export const CF_HOSTS: { host: string; label: string }[] = [
  { host: "www.cloudflare.com", label: "Cloudflare" },
  { host: "1.1.1.1", label: "1.1.1.1" },
  { host: "speed.cloudflare.com", label: "Speed" },
  { host: "cdnjs.cloudflare.com", label: "CDNJS" },
  { host: "workers.cloudflare.com", label: "Workers" },
  { host: "api.openai.com", label: "OpenAI API" },
  { host: "gateway.discord.gg", label: "Discord GW" },
];

function field(text: string, key: string): string {
  const m = new RegExp(`^${key}=(.*)$`, "m").exec(text);
  return m?.[1]?.trim() || "";
}

export async function probeCfTrace(host: string, timeoutMs = 10000): Promise<CfTrace> {
  const out: CfTrace = {
    host, ok: false, ms: 0, ip: "", loc: "", colo: "", warp: "",
    http: "", tls: "", sni: "", kex: "", gateway: "", rbi: "",
  };
  const t0 = performance.now();
  try {
    const res = await fetch(`https://${host}/cdn-cgi/trace?_t=${Date.now()}`, {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    out.ip = field(text, "ip");
    out.loc = field(text, "loc").toUpperCase();
    out.colo = field(text, "colo").toUpperCase();
    out.warp = field(text, "warp");
    out.http = field(text, "http");
    out.tls = field(text, "tls");
    out.sni = field(text, "sni");
    out.kex = field(text, "kex");
    out.gateway = field(text, "gateway");
    out.rbi = field(text, "rbi");
    out.ok = Boolean(out.ip);
  } catch {
    out.ok = false;
  }
  out.ms = Math.round(performance.now() - t0);
  return out;
}

export async function probeCfAll(timeoutMs = 10000): Promise<CfTrace[]> {
  return Promise.all(CF_HOSTS.map((h) => probeCfTrace(h.host, timeoutMs)));
}
