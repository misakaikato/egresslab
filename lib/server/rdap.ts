// RDAP 查询:域名 / IP / ASN 三路,走 rdap.org 引导
export interface RdapResult {
  kind: "domain" | "ip" | "asn";
  query: string;
  ok: boolean;
  error?: string;
  // 归一化后的关键字段
  name?: string; // 域名 / 网络名 / AS 名
  handle?: string;
  status?: string[];
  events?: { action: string; date: string }[];
  nameservers?: string[];
  entities?: { handle: string; roles: string[]; fn?: string }[];
  // IP/ASN 特有
  startAddress?: string;
  endAddress?: string;
  country?: string;
  type?: string;
  raw?: any;
}

const DOMAIN_RE = /^(?=.{1,253}$)([a-zA-Z0-9_]([a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]+:)+[0-9a-fA-F:.]+$/;
const ASN_RE = /^(as)?(\d{1,10})$/i;

export function classifyQuery(q: string): { kind: RdapResult["kind"]; value: string } | null {
  const s = q.trim();
  if (!s || s.length > 255) return null;
  if (IP_RE.test(s)) return { kind: "ip", value: s };
  const am = ASN_RE.exec(s);
  if (am && /^(as)\d+$/i.test(s)) return { kind: "asn", value: am[2] };
  if (DOMAIN_RE.test(s)) return { kind: "domain", value: s.toLowerCase() };
  return null;
}

function ev(j: any, ...actions: string[]): { action: string; date: string }[] {
  return (j?.events || [])
    .filter((e: any) => actions.includes(e?.eventAction))
    .map((e: any) => ({ action: e.eventAction, date: e.eventDate || "" }));
}

function entities(j: any): RdapResult["entities"] {
  return (j?.entities || []).slice(0, 8).map((e: any) => ({
    handle: e?.handle || "",
    roles: e?.roles || [],
    fn: e?.vcardArray?.[1]?.find((v: any) => v?.[0] === "fn")?.[3] || "",
  }));
}

export async function rdapLookup(q: string): Promise<RdapResult> {
  const c = classifyQuery(q);
  if (!c) return { kind: "domain", query: q, ok: false, error: "invalid" };
  const url =
    c.kind === "domain" ? `https://rdap.org/domain/${encodeURIComponent(c.value)}`
    : c.kind === "ip" ? `https://rdap.org/ip/${encodeURIComponent(c.value)}`
    : `https://rdap.org/autnum/${c.value}`;
  const base: RdapResult = { kind: c.kind, query: q.trim(), ok: false };
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { accept: "application/rdap+json, application/json", "user-agent": "exitlens-whois/1.0" },
      cache: "no-store",
    });
    if (res.status === 404) return { ...base, error: "not_found" };
    if (!res.ok) return { ...base, error: `http_${res.status}` };
    const j = await res.json();
    base.ok = true;
    base.handle = j?.handle || "";
    base.status = j?.status || [];
    base.entities = entities(j);
    base.raw = j;
    if (c.kind === "domain") {
      base.name = j?.ldhName || j?.unicodeName || c.value;
      base.events = ev(j, "registration", "expiration", "last changed", "last update of RDAP database");
      base.nameservers = (j?.nameservers || []).map((n: any) => n?.ldhName).filter(Boolean).slice(0, 6);
    } else {
      base.name = j?.name || j?.handle || "";
      base.startAddress = j?.startAddress || "";
      base.endAddress = j?.endAddress || "";
      base.country = (j?.country || "").toUpperCase();
      base.type = j?.type || "";
      base.events = ev(j, "registration", "last changed", "last update of RDAP database");
    }
    return base;
  } catch {
    return { ...base, error: "network" };
  }
}
