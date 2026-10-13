// 各免费数据源适配:ipwho.is / ip-api.com / rdap / DNSBL / 可选 proxycheck+abuseipdb
export interface GeoSource {
  country_code?: string;
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

async function jsonFetch(url: string, timeoutMs = 10000): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store", headers: { "user-agent": "egresslab/0.1" } });
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

// DNSBL:barracuda + sorbs,异常静默 0 分
// RFC 5782:DNSBL 命中应答必须在 127.0.0.0/8;其余(如 fake-ip 的 198.18.x)视为未命中
export async function dnsblScore(ip: string): Promise<{ score: number; hitZones: string[] }> {
  if (ip.includes(":")) return { score: 0, hitZones: [] };
  const rev = ip.split(".").reverse().join(".");
  const zones = ["b.barracudacentral.org", "dnsbl.sorbs.net"];
  const hits = await Promise.all(
    zones.map(async (z) => {
      try {
        const { resolve4 } = await import("node:dns/promises");
        const answers = await resolve4(`${rev}.${z}`);
        const real = (answers || []).some((a) => a.startsWith("127."));
        return real ? z : null;
      } catch {
        return null;
      }
    })
  );
  const hitZones = hits.filter((z): z is string => !!z);
  return { score: Math.min(100, hitZones.length * 50), hitZones };
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
    const r = await dnsblScore(`${base}.${n}`);
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
