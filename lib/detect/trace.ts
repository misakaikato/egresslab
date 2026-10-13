// cdn-cgi/trace 探测:Cloudflare 回显出口 IP/loc/warp/colo;失败降级 favicon 连通探测
import type { TraceProbe } from "../types";

function parseTrace(text: string, key: string): string {
  const m = new RegExp(`^${key}=(.+)$`, "m").exec(text);
  return m?.[1]?.trim() || "";
}

function faviconReachable(host: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.onload = () => finish(true);
    img.onerror = () => finish(true); // 404 也证明可连通
    img.src = `https://${host}/favicon.ico?_t=${Date.now()}`;
    void t0;
  });
}

export async function probeTrace(host: string, timeoutMs = 12000): Promise<TraceProbe> {
  const out: TraceProbe = { host, status: "pending", ip: "", country: "", warp: "", colo: "", ms: 0, fallback: false, httpStatus: 0, challenged: false };
  const t0 = performance.now();
  try {
    const res = await fetch(`https://${host}/cdn-cgi/trace?_t=${Date.now()}`, {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(timeoutMs),
    });
    out.httpStatus = res.status;
    if (res.status === 403 || res.status === 503) {
      out.challenged = true;
      throw new Error(`edge challenge ${res.status}`);
    }
    if (!res.ok) throw new Error(`trace HTTP ${res.status}`);
    const text = await res.text();
    out.ip = parseTrace(text, "ip");
    if (!out.ip) throw new Error("trace has no ip");
    out.country = parseTrace(text, "loc").toUpperCase();
    out.warp = parseTrace(text, "warp");
    out.colo = parseTrace(text, "colo");
    out.ms = Math.round(performance.now() - t0);
    out.status = "ok";
    return out;
  } catch {
    out.fallback = true;
    const reachable = await faviconReachable(host, 6000);
    out.ms = Math.round(performance.now() - t0);
    out.status = reachable ? "ok" : "failed";
    return out;
  }
}

export const ANTHROPIC_HOSTS = ["claude.ai", "api.anthropic.com", "platform.claude.com"] as const;
