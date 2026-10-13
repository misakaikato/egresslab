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

export async function probeDualStack(): Promise<{ v4: StackInfo | null; v6: StackInfo | null }> {
  const [v4, v6] = await Promise.all([probeFamily("ipv4.icanhazip.com", false), probeFamily("ipv6.icanhazip.com", true)]);
  return { v4, v6 };
}
