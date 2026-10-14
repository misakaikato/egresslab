// 各免费数据源适配:ipwho.is / ip-api.com / rdap / DNSBL / 可选 proxycheck+abuseipdb
export interface GeoSource {
  country_code?: string;
  region?: string;
  country_en?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  asn?: number;
  asn_name?: string;
  asn_type?: string;
  isp?: string;
  org?: string;
  country?: string; // RDAP 注册国
}

export async function jsonFetch(url: string, timeoutMs = 10000): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store", headers: { "user-agent": "exitlens/0.1" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fromIpWho(ip: string): Promise<GeoSource> {
  const j = await jsonFetch(`https://ipwho.is/${ip}`);
  if (j?.success === false) throw new Error(j?.message || "ipwho failed");
  return {
    country_code: j?.country_code, country_en: j?.country, city: j?.city,
    timezone: j?.timezone?.id,
    latitude: typeof j?.latitude === "number" ? j.latitude : undefined,
    longitude: typeof j?.longitude === "number" ? j.longitude : undefined,
    asn: j?.connection?.asn, asn_name: j?.connection?.org, isp: j?.connection?.isp,
  };
}

export async function fromIpApiCom(ip: string): Promise<GeoSource & { proxy?: boolean; hosting?: boolean; mobile?: boolean }> {
  const j = await jsonFetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,timezone,lat,lon,as,org,isp,proxy,hosting,mobile,asn`);
  if (j?.status !== "success") throw new Error("ip-api failed");
  return {
    country_code: j.countryCode, country_en: j.country, city: j.city, timezone: j.timezone,
    latitude: j.lat, longitude: j.lon,
    asn: j.asn, asn_name: j.org, isp: j.isp,
    proxy: !!j.proxy, hosting: !!j.hosting, mobile: !!j.mobile,
  };
}

export async function fromRdap(ip: string): Promise<GeoSource> {
  const j = await jsonFetch(`https://rdap.org/ip/${ip}`, 12000);
  let country = "";
  if (typeof j?.country === "string" && j.country) country = j.country.toUpperCase().slice(0, 2);
  let org = "";
  const entities: any[] = j?.entities || [];
  for (const ent of entities) {
    const vcard = ent?.vcardArray?.[1] as [string, string, string, string][] | undefined;
    const fn = vcard?.find(([k]) => k === "fn")?.[3];
    if (typeof fn === "string" && fn) { org = fn; break; }
  }
  return { org };
}

// DNSBL 12 区分类检测(对齐社区主流清单):垃圾邮件/声誉/僵尸网络/恶意代码/代理Tor
// RFC 5782:DNSBL 命中应答必须在 127.0.0.0/8;其余(如 fake-ip 的 198.18.x)视为未命中
export type DnsblCat = "spam" | "reputation" | "botnet" | "malware" | "proxy";
export interface DnsblZone { zone: string; name: string; cat: DnsblCat; weight: number }
export interface DnsblHit { zone: string; name: string; cat: DnsblCat; listed: boolean; ms: number }

export const DNSBL_ZONES: DnsblZone[] = [
  { zone: "zen.spamhaus.org", name: "Spamhaus ZEN", cat: "spam", weight: 50 },
  { zone: "bl.spamcop.net", name: "SpamCop", cat: "spam", weight: 30 },
  { zone: "b.barracudacentral.org", name: "Barracuda", cat: "reputation", weight: 25 },
  { zone: "dnsbl.dronebl.org", name: "DroneBL", cat: "botnet", weight: 25 },
  { zone: "psbl.surriel.com", name: "PSBL", cat: "spam", weight: 20 },
  { zone: "bl.blocklist.de", name: "Blocklist.de", cat: "botnet", weight: 20 },
  { zone: "db.wpbl.info", name: "WPBL", cat: "malware", weight: 20 },
  { zone: "truncate.gbudb.net", name: "GBUdb", cat: "reputation", weight: 15 },
  { zone: "opm.tornevall.org", name: "Tornevall", cat: "proxy", weight: 15 },
  { zone: "hostkarma.junkemailfilter.com", name: "JunkEmailFilter", cat: "reputation", weight: 15 },
  { zone: "all.s5h.net", name: "S5h", cat: "spam", weight: 15 },
  { zone: "ix.manitu.net", name: "Manitu", cat: "spam", weight: 15 },
];
// 邻居采样用轻量子集(控制 DNS 查询量)
const DNSBL_LIGHT = DNSBL_ZONES.filter((z) => ["zen.spamhaus.org", "bl.spamcop.net", "b.barracudacentral.org", "dnsbl.dronebl.org"].includes(z.zone));

async function dnsblQuery(rev: string, z: DnsblZone): Promise<DnsblHit> {
  const t0 = Date.now();
  try {
    const { resolve4 } = await import("node:dns/promises");
    const answers = await resolve4(`${rev}.${z.zone}`);
    // hostkarma:127.0.0.1=白名单(明确干净),仅 127.0.0.2 计为命中
    const listed = z.zone === "hostkarma.junkemailfilter.com"
      ? (answers || []).includes("127.0.0.2")
      : (answers || []).some((a) => a.startsWith("127."));
    return { zone: z.zone, name: z.name, cat: z.cat, listed, ms: Date.now() - t0 };
  } catch {
    return { zone: z.zone, name: z.name, cat: z.cat, listed: false, ms: Date.now() - t0 };
  }
}

export async function dnsblCheck(ip: string, zones: DnsblZone[] = DNSBL_ZONES): Promise<DnsblHit[]> {
  if (ip.includes(":")) return [];
  const rev = ip.split(".").reverse().join(".");
  return Promise.all(zones.map((z) => dnsblQuery(rev, z)));
}

export function dnsblScoreFromHits(hits: DnsblHit[]): { score: number; hitZones: string[] } {
  const listed = hits.filter((h) => h.listed);
  const score = Math.min(100, listed.reduce((s, h) => s + (DNSBL_ZONES.find((z) => z.zone === h.zone)?.weight ?? 15), 0));
  return { score, hitZones: listed.map((h) => h.zone) };
}

export async function dnsblScore(ip: string, zones?: DnsblZone[]): Promise<{ score: number; hitZones: string[]; detail: DnsblHit[] }> {
  const detail = await dnsblCheck(ip, zones);
  return { ...dnsblScoreFromHits(detail), detail };
}
// 邻居采样入口(轻量区集)
export async function dnsblScoreLight(ip: string): Promise<{ score: number; hitZones: string[] }> {
  const detail = await dnsblCheck(ip, DNSBL_LIGHT);
  return dnsblScoreFromHits(detail);
}

export async function fromProxycheck(ip: string, key: string): Promise<{ vpn: boolean; proxy: boolean; residential: boolean; type: string } | null> {
  try {
    const j = await jsonFetch(`https://proxycheck.io/v2/${ip}?key=${key}&vpn=1&asn=1&risk=1`);
    const r = j?.[ip];
    if (!r || r.proxy === "no") return { vpn: false, proxy: false, residential: false, type: "" };
    const type = String(r.type || "").toUpperCase();
    return {
      vpn: type === "VPN" || r.proxy === "yes",
      proxy: ["SOCKS", "SOCKS4", "SOCKS5", "HTTP", "PUB", "WEB"].some((t) => type.includes(t)),
      residential: type.includes("RES"),
      type,
    };
  } catch {
    return null;
  }
}

export async function fromAbuseipdb(ip: string, key: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
      headers: { Key: key, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const s = j?.data?.abuseConfidenceScore;
    return typeof s === "number" ? s : null;
  } catch {
    return null;
  }
}

// PTR 正反向一致性:反向解析出的主机名再正向解析,应包含原 IP
export async function ptrCheck(ip: string): Promise<{ host: string; match: boolean | null } | null> {
  try {
    const dns = await import("node:dns/promises");
    const hosts = await dns.reverse(ip).catch((e: any) => (e?.code === "ENOTFOUND" ? [] as string[] : Promise.reject(e)));
    if (!hosts.length) return { host: "", match: null };
    const host = hosts[0];
    try {
      const fwd = await Promise.all([dns.resolve4(host).catch(() => [] as string[]), dns.resolve6(host).catch(() => [] as string[])]);
      const all = fwd.flat();
      return { host, match: all.includes(ip) };
    } catch {
      return { host, match: false };
    }
  } catch {
    return null;
  }
}

// 注册国(RIPEstat whois 聚合,ARIN RDAP 顶层无 country 时的可靠来源)
export async function whoisCountry(ip: string): Promise<string | null> {
  try {
    const j = await jsonFetch(`https://stat.ripe.net/data/whois/data.json?resource=${ip}`, 12000);
    const recs: any[] = j?.data?.records || [];
    for (const row of recs) {
      if (!Array.isArray(row)) continue;
      for (const kv of row) {
        if (typeof kv?.key === "string" && kv.key.toLowerCase() === "country" && typeof kv.value === "string" && kv.value) return kv.value.toUpperCase().slice(0, 2);
      }
    }
    return null;
  } catch {
    return null;
  }
}

// 前缀首次宣告时间(RIPEstat,免费无 key)
export async function prefixFirstSeen(ip: string): Promise<string | null> {
  try {
    const j = await jsonFetch(`https://stat.ripe.net/data/routing-status/data.json?resource=${ip}`, 12000);
    const t = j?.data?.first_seen?.time;
    return typeof t === "string" && t ? t : null;
  } catch {
    return null;
  }
}

// 同 /24 邻居 DNSBL 采样(排除自身,随机 2 个)
export async function neighborFlags(ip: string): Promise<{ flagged: number; sampled: number } | null> {
  if (ip.includes(":")) return null;
  // CF anycast 段的"邻居"无语义,跳过
  const { isCloudflareIp } = await import("../../detect/dns");
  if (isCloudflareIp(ip)) return null;
  const base = ip.split(".").slice(0, 3).join(".");
  const selfLast = Number(ip.split(".")[3]);
  const cands = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    .map((n) => (selfLast + n * 7) % 254 + 1)
    .filter((n) => n !== selfLast)
    .slice(0, 2);
  let flagged = 0;
  for (const n of cands) {
    const r = await dnsblScoreLight(`${base}.${n}`);
    if (r.score > 0) flagged++;
  }
  return { flagged, sampled: cands.length };
}

// ThreatFox(abuse.ch):恶意 IoC 检索,无需 key
export async function threatfoxHit(ip: string): Promise<boolean | null> {
  try {
    const res = await fetch("https://threatfox.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "search_ioc", search_term: ip }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (j?.query_status === "no_result") return false;
    return j?.query_status === "ok" && Array.isArray(j?.data) && j.data.length > 0;
  } catch {
    return null;
  }
}

// StopForumSpam:垃圾注册 IP,免费无需 key
export async function sfsCheck(ip: string): Promise<{ appears: boolean; frequency: number } | null> {
  try {
    const res = await fetch(`https://api.stopforumspam.org/api?ip=${encodeURIComponent(ip)}&json`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const d = j?.ip;
    if (!d || typeof d.appears !== "number") return null;
    return { appears: d.appears === 1, frequency: Number(d.frequency) || 0 };
  } catch {
    return null;
  }
}

// PeeringDB ASN 分类(免费无 key;区分骨干转接与消费级运营商)
const TRANSIT_RE = /gtt|cogent|lumen|level\s*3|telia|arelion|zayo|hurricane electric|\bhe\.net|pccw|tata communications|seaborn|gblx|savvis|centurylink| Liberty/i;
const CONSUMER_RE = /telecom|unicom|comcast|verizon|at&t|vodafone|deutsche telekom|orange|british telecom|bell canada|telstra|jio|airtel|charter|spectrum|cox comm|kddi|softbank|chunghwa|pldt|starhub|singtel|sky broadband|virgin media|talktalk/i;

export interface PdbAsn {
  info_type: string;
  name: string;
}

export async function peerAsnInfo(asn: number): Promise<PdbAsn | null> {
  try {
    const { getDb, dbTry } = await import("../db");
    const key = `pdb-asn:${asn}`;
    const cached = dbTry(() => getDb().prepare("SELECT json FROM intel_cache WHERE key=? AND ts > ?").get(key, Date.now() - 7 * 86400_000) as any, undefined);
    if (cached?.json) return JSON.parse(cached.json);
    const j = await jsonFetch(`https://www.peeringdb.com/api/net?asn=${asn}`, 12000);
    const n = j?.data?.[0];
    if (!n?.info_type) return null;
    const out = { info_type: String(n.info_type), name: String(n.name || "") };
    dbTry(() => {
      const d = getDb();
      d.prepare("INSERT INTO intel_cache(key,ts,ttl_ms,json) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, json=excluded.json").run(key, Date.now(), 7 * 86400_000, JSON.stringify(out));
    }, undefined);
    return out;
  } catch {
    return null;
  }
}

// 综合网络分类:ip-api 旗标 + PeeringDB + 关键词
export function classifyNetwork(opts: { hosting?: boolean; mobile?: boolean; asnName: string; pdb: PdbAsn | null }): { type: string; pdbType: string | null } {
  if (opts.hosting) return { type: "hosting", pdbType: opts.pdb?.info_type || null };
  if (opts.mobile) return { type: "mobile", pdbType: opts.pdb?.info_type || null };
  if (opts.pdb) {
    const nm = `${opts.pdb.name} ${opts.asnName}`.toLowerCase();
    if (opts.pdb.info_type === "Content") return { type: "cdn", pdbType: opts.pdb.info_type };
    if (opts.pdb.info_type === "NSP") {
      if (TRANSIT_RE.test(nm)) return { type: "transit", pdbType: "NSP" };
      if (CONSUMER_RE.test(nm)) return { type: "isp", pdbType: "NSP" };
      return { type: "isp", pdbType: `${opts.pdb.info_type}?` };
    }
    if (/Cable|MSO|ISP|Enterprise/.test(opts.pdb.info_type)) return { type: opts.pdb.info_type.includes("Enterprise") ? "business" : "isp", pdbType: opts.pdb.info_type };
  }
  return { type: "isp", pdbType: opts.pdb?.info_type || null };
}

// IP2Location.io 在线 API(含 is_proxy / usage_type)
export async function fromIp2LocationIo(ip: string, key: string): Promise<GeoSource & { proxy?: boolean; usageType?: string }> {
  const j = await jsonFetch(`https://api.ip2location.io/?key=${key}&ip=${encodeURIComponent(ip)}&format=json`, 10000);
  if (j === null || j === undefined || j.error) throw new Error(j?.error || "ip2location.io failed");
  return {
    country_code: j.country_code,
    country_en: j.country_name,
    region: j.region_name,
    city: j.city_name,
    timezone: j.time_zone,
    latitude: typeof j.latitude === "number" ? j.latitude : undefined,
    longitude: typeof j.longitude === "number" ? j.longitude : undefined,
    asn: j.asn,
    asn_name: j.as,
    proxy: j.is_proxy === true,
    usageType: j.usage_type ? String(j.usage_type) : undefined,
  };
}

// IPInfo 在线 API(token 复用 IPINFO_TOKEN)
export async function fromIpInfoApi(ip: string, token: string): Promise<GeoSource> {
  const j = await jsonFetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${token}`, 10000);
  if (j?.error) throw new Error(String(j.error));
  const loc = String(j.loc || "").split(",");
  return {
    country_code: j.country,
    country_en: j.country,
    region: j.region,
    city: j.city,
    timezone: j.timezone,
    latitude: loc[0] ? Number(loc[0]) : undefined,
    longitude: loc[1] ? Number(loc[1]) : undefined,
    asn_name: j.org,
    isp: j.org,
  };
}

// ---- BGP / ASN 详情(RIPEstat,ASN 级数据 7 天缓存) ----
export interface AsnOverview {
  asn: number;
  holder: string;
  prefixes_v4: number;
  prefixes_v6: number;
}

export interface AsnUpstream {
  asn: number;
  name: string;
  share: number; // 0-1 路径占比(RIS 探针观测)
  tier1: boolean;
}

// 公认 Tier 1 骨干(无上游转接即达全球)
const TIER1 = new Set([174, 209, 286, 2914, 3257, 3320, 3356, 3491, 5511, 6453, 6461, 6762, 6830, 7018, 1239, 1299]);

async function asnCacheGet(key: string): Promise<any> {
  try {
    // 复用 intel_cache 表(与 peerAsnInfo 同一模式)
    const { getDb, dbTry } = await import("../db");
    const cached = dbTry(() => getDb().prepare("SELECT json FROM intel_cache WHERE key=? AND ts > ?").get(key, Date.now() - 7 * 86400_000) as any, undefined);
    return cached?.json ? JSON.parse(cached.json) : null;
  } catch {
    return null;
  }
}
async function asnCacheSet(key: string, val: any): Promise<void> {
  try {
    const { getDb, dbTry } = await import("../db");
    dbTry(() => {
      getDb().prepare("INSERT INTO intel_cache(key,ts,ttl_ms,json) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, json=excluded.json").run(key, Date.now(), 7 * 86400_000, JSON.stringify(val));
    }, undefined);
  } catch {}
}

export async function asnOverview(asn: number): Promise<AsnOverview | null> {
  if (!asn) return null;
  const key = `asn-overview:${asn}`;
  const c = await asnCacheGet(key);
  if (c) return c;
  try {
    const [ov, pf] = await Promise.all([
      jsonFetch(`https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`, 12000),
      jsonFetch(`https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS${asn}`, 12000).catch(() => null),
    ]);
    const d = ov?.data;
    if (!d?.holder) return null;
    const prefixes: any[] = pf?.data?.prefixes || [];
    const out: AsnOverview = {
      asn,
      holder: String(d.holder),
      prefixes_v4: prefixes.filter((p) => !String(p?.prefix || "").includes(":")).length,
      prefixes_v6: prefixes.filter((p) => String(p?.prefix || "").includes(":")).length,
    };
    await asnCacheSet(key, out);
    return out;
  } catch {
    return null;
  }
}

export async function asnUpstreams(asn: number): Promise<AsnUpstream[] | null> {
  if (!asn) return null;
  const key = `asn-upstreams:${asn}`;
  const c = await asnCacheGet(key);
  if (c) return c;
  try {
    const j = await jsonFetch(`https://stat.ripe.net/data/asn-neighbours/data.json?resource=AS${asn}`, 12000);
    const list: any[] = j?.data?.neighbours || [];
    const lefts = list.filter((n) => n?.type === "left");
    if (!lefts.length) return null;
    const total = lefts.reduce((s, n) => s + (Number(n.power) || 0), 0) || 1;
    const out: AsnUpstream[] = lefts
      .map((n) => ({
        asn: Number(n.asn),
        name: String(n?.name || ""),
        share: Math.round(((Number(n.power) || 0) / total) * 1000) / 10,
        tier1: TIER1.has(Number(n.asn)),
      }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 8);
    await asnCacheSet(key, out);
    return out;
  } catch {
    return null;
  }
}
