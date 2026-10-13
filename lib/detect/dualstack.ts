// 双栈出口:icanhazip 分族端点(CORS 全开)+ ipwho.is 补归属国
export interface StackInfo {
  ip: string;
  country: string;
}

const IP4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

async function fetchText(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return (await res.text()).trim();
  } catch {
    return null;
  }
}

async function probeFamily(host: string, isV6: boolean): Promise<StackInfo | null> {
  const ip = await fetchText(`https://${host}/`, 6000);
  if (!ip) return null;
  const valid = isV6 ? ip.includes(":") : IP4_RE.test(ip);
  if (!valid) return null;
  let country = "";
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(6000) });
    const j = await res.json();
    if (j?.success !== false) country = String(j?.country_code || "").toUpperCase();
  } catch {}
  return { ip, country };
}

export interface ForcedFamily {
  v4Forced: boolean; // v4-only 端点可达
  v6Forced: boolean; // v6-only 端点可达
  preferred: "IPv4" | "IPv6" | null; // 双栈可选时浏览器实际选择的族
}

// 强制族探测:api4/api6.ipify 只有单族记录,浏览器被迫走对应族
// 偏好族:ipwho.is 返回的 type 字段反映实际连接族
export async function probeForcedFamily(): Promise<ForcedFamily> {
  const txt = async (u: string) => {
    try {
      const r = await fetch(u, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(6000) });
      return (await r.text()).trim();
    } catch {
      return "";
    }
  };
  const [v4, v6, dual] = await Promise.all([txt("https://api4.ipify.org/"), txt("https://api6.ipify.org/"), txt("https://ipwho.is/")]);
  let preferred: "IPv4" | "IPv6" | null = null;
  try {
    const j = JSON.parse(dual);
    preferred = j?.type === "IPv6" ? "IPv6" : j?.type === "IPv4" ? "IPv4" : null;
  } catch {}
  return { v4Forced: /^\d+\.\d+\.\d+\.\d+$/.test(v4), v6Forced: v6.includes(":"), preferred };
}

export async function probeDualStack(): Promise<{ v4: StackInfo | null; v6: StackInfo | null }> {
  const [v4, v6] = await Promise.all([probeFamily("ipv4.icanhazip.com", false), probeFamily("ipv6.icanhazip.com", true)]);
  return { v4, v6 };
}
