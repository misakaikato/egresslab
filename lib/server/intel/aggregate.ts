// 聚合层:多源并发 → 合并(geo 多数决/risk 最坏值)→ 缓存 1h → 写信誉库
import type { IntelResult } from "../../types";
import { getDb, dbTry } from "../db";
import { getTorSet, loadFirehol, inFirehol } from "./lists";
import { lookupLocalGeo, lookupLocalPrivacy } from "./local";
import { fromIpWho, fromIpApiCom, fromRdap, dnsblScore, fromProxycheck, fromAbuseipdb, ptrCheck, prefixFirstSeen, neighborFlags, whoisCountry, threatfoxHit, sfsCheck, peerAsnInfo, classifyNetwork, fromIp2LocationIo, fromIpInfoApi, type GeoSource } from "./geo";

const PRIVATE_V4 = [/^10\./, /^127\./, /^0\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^2(2[4-9]|[34]\d)\./];
export function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) return /^(::1|f[cd]|fe80)/i.test(ip);
  return PRIVATE_V4.some((re) => re.test(ip));
}

const CACHE_TTL = 3600_000;
const EMPTY: IntelResult = {
  ok: true, ip: "", private: false, geo: {}, network: {}, risk: {},
  meta: { cached: false, age_ms: 0, sources_ok: 0, sources_failed: [] },
};

export async function aggregateIp(rawIp: string): Promise<IntelResult> {
  const ip = rawIp.trim();
  if (isPrivateIp(ip)) return { ...EMPTY, ip, private: true, meta: { cached: false, age_ms: 0, sources_ok: 0, sources_failed: [] } };

  const d = getDb();
  const cacheKey = `intel:${ip}`;
  const cached = dbTry(
    () => d.prepare("SELECT ts, json FROM intel_cache WHERE key=?").get(cacheKey) as { ts: number; json: string } | undefined,
    undefined
  );
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const j = JSON.parse(cached.json) as IntelResult;
    return { ...j, meta: { ...j.meta, cached: true, age_ms: Date.now() - cached.ts } };
  }

  const failed: string[] = [];
  const ioKey = process.env.IP2LOCATION_IO_KEY;
  const infoKey = process.env.IPINFO_TOKEN;
  const [tf, sfs, fhOk, ip2l, ipinfo] = await Promise.all([
    threatfoxHit(ip).catch(() => null),
    sfsCheck(ip).catch(() => null),
    loadFirehol(),
    ioKey ? fromIp2LocationIo(ip, ioKey).catch(() => null) : null,
    infoKey ? fromIpInfoApi(ip, infoKey).catch(() => null) : null,
  ]);
  if (ioKey && !ip2l) failed.push("ip2location.io");
  if (infoKey && !ipinfo) failed.push("ipinfo");
  const settled = await Promise.allSettled([fromIpWho(ip), fromIpApiCom(ip), fromRdap(ip), getTorSet(), dnsblScore(ip), whoisCountry(ip).catch(() => null)]);
  const regCountry = settled[5].status === "fulfilled" ? (settled[5].value as string | null) : null;
  const who = settled[0].status === "fulfilled" ? (settled[0].value as GeoSource | undefined) : undefined;
  const api = settled[1].status === "fulfilled" ? (settled[1].value as Awaited<ReturnType<typeof fromIpApiCom>> | undefined) : undefined;
  const rdap = settled[2].status === "fulfilled" ? (settled[2].value as GeoSource | undefined) : undefined;
  const torSet = settled[3].status === "fulfilled" ? (settled[3].value as Set<string> | undefined) : undefined;
  const dnsbl = settled[4].status === "fulfilled" ? (settled[4].value as { score: number; hitZones: string[] } | undefined) : undefined;
  if (settled[0].status === "rejected") failed.push("ipwho.is");
  if (settled[1].status === "rejected") failed.push("ip-api.com");
  if (settled[2].status === "rejected") failed.push("rdap.org");
  const dnsblOk = settled[4].status === "fulfilled";
  if (!dnsblOk) failed.push("dnsbl");
  if (tf === null) failed.push("threatfox");
  if (sfs === null) failed.push("sfs");
  if (!fhOk) failed.push("firehol");

  if (!who && !api) {
    if (cached) {
      const j = JSON.parse(cached.json) as IntelResult;
      return { ...j, meta: { ...j.meta, cached: true, age_ms: Date.now() - cached.ts } };
    }
    throw Object.assign(new Error("all_sources_failed"), { statusCode: 502 });
  }

  // 本地库(统一接口):geo 投票 + 隐私旗标,全部零网络
  const localHits = lookupLocalGeo(ip);
  const localPrivacy = lookupLocalPrivacy(ip);

  // geo 合并:国家取多数决(在线+本地),其余字段按优先级补
  const votes = [who?.country_code, api?.country_code, ip2l?.country_code, ipinfo?.country_code, ...localHits.map((h) => h.country)]
    .filter((c): c is string => !!c)
    .map((c) => c.toUpperCase());
  const majority = votes.length ? votes.sort((a, b) => votes.filter((v) => v === b).length - votes.filter((v) => v === a).length)[0] : "";
  const localTz = localHits.find((h) => h.timezone);
  const localCity = localHits.find((h) => h.city && h.source === "ip2region") || localHits.find((h) => h.city);
  const localAsn = localHits.find((h) => h.asn);
  const geo = {
    country_code: majority || who?.country_code || api?.country_code || "",
    country_en: who?.country_en || api?.country_en || "",
    city: who?.city || api?.city || localCity?.city || "",
    timezone: who?.timezone || api?.timezone || localTz?.timezone || "",
    latitude: who?.latitude ?? api?.latitude ?? null,
    longitude: who?.longitude ?? api?.longitude ?? null,
  };
  const network: IntelResult["network"] = {
    asn: who?.asn ?? api?.asn ?? localAsn?.asn ?? null,
    asn_name: who?.asn_name || api?.asn_name || localAsn?.asnName || "",
    asn_type: api?.hosting ? "hosting" : api?.mobile ? "mobile" : "isp",
    isp: who?.isp || api?.isp || rdap?.org || "",
  };
  // PeeringDB 综合分类:ip-api 旗标对一级转接商(GTT 等)失效,PeeringDB NSP+关键词补判
  if (network.asn) {
    const pdb = await peerAsnInfo(network.asn).catch(() => null);
    if (pdb) {
      const cls = classifyNetwork({ hosting: !!api?.hosting, mobile: !!api?.mobile, asnName: network.asn_name || "", pdb });
      network.asn_type = cls.type;
      network.pdb_type = cls.pdbType || "";
    }
  }

  const orgBlob = `${network.asn_name} ${network.isp} ${rdap?.org || ""}`.toLowerCase();
  const officialExit = /mullvad/.test(orgBlob) ? "mullvad" : /icloud private relay/.test(orgBlob) ? "icloud_relay" : null;

  const sources: string[] = ["ipwho.is", "ip-api.com"];
  if (ip2l) sources.push("ip2location.io");
  if (ipinfo) sources.push("ipinfo");
  if (rdap) sources.push("rdap.org");
  if (torSet) sources.push("tor");
  if (dnsblOk) sources.push("dnsbl");
  if (network.pdb_type) sources.push("peeringdb");
  if (tf !== null) sources.push("threatfox");
  if (sfs !== null) sources.push("sfs");

  // 黑名单合成:dnsbl(50/区)/firehol(70)/threatfox(60)/sfs(40),取最大
  let blacklist = dnsblOk ? (dnsbl?.score ?? 0) : 0;
  if (fhOk) {
    const fh = inFirehol(ip);
    if (fh === null) { /* 列表未加载 */ }
    else if (fh) blacklist = Math.max(blacklist, 70);
  }
  if (tf) blacklist = Math.max(blacklist, 60);
  if (sfs?.appears) blacklist = Math.max(blacklist, 40);
  if (fhOk) sources.push("firehol");
  for (const h of localHits) sources.push(h.source);
  for (const h of localPrivacy) sources.push(h.source);

  const anyPriv = (k: "vpn" | "proxy" | "hosting" | "tor") => localPrivacy.some((p) => p[k]);
  const ip2lDch = typeof ip2l?.usageType === "string" && /DCH|SPX|SES/i.test(ip2l.usageType);
  const risk: IntelResult["risk"] = {
    is_vpn: anyPriv("vpn"),
    is_proxy: !!api?.proxy || !!ip2l?.proxy || anyPriv("proxy"),
    is_tor: torSet ? torSet.has(ip) : false || anyPriv("tor"),
    is_datacenter: !!api?.hosting || ip2lDch || anyPriv("hosting"),
    is_residential_proxy: false,
    is_abuser: !!tf || !!sfs?.appears,
    official_exit: officialExit,
    abuse_score: 0,
    blacklist_score: blacklist,
    sources,
  };

  // 原生性:注册国(RIPEstat whois)vs 定位国;CDN/anycast 段无意义不判
  const { isCloudflareIp } = await import("../../detect/dns");
  if (!isCloudflareIp(ip)) {
    const regC = (regCountry || rdap?.country || "").toUpperCase();
    if (regC && geo.country_code) network.native = regC === geo.country_code.toUpperCase();
  }

  // 服务端免费增强:PTR 一致性 / 前缀年龄 / 邻居采样(并行,失败静默)
  const pcKeyEarly = process.env.PROXYCHECK_API_KEY ? fromProxycheck(ip, process.env.PROXYCHECK_API_KEY).catch(() => null) : null;
  const abKeyEarly = process.env.ABUSEIPDB_API_KEY ? fromAbuseipdb(ip, process.env.ABUSEIPDB_API_KEY).catch(() => null) : null;
  const [ptr, firstSeen, neighbors, pcEarly, abEarly] = await Promise.all([ptrCheck(ip).catch(() => null), prefixFirstSeen(ip).catch(() => null), neighborFlags(ip).catch(() => null), pcKeyEarly, abKeyEarly]);
  if (ptr) network.ptr = ptr as any;
  if (firstSeen) risk.prefix_first_seen = firstSeen;
  if (neighbors) risk.neighbors_flagged = neighbors.flagged;

  // 可选增强源(已在上方并行预取)
  const pc = pcEarly;
  if (pc) {
    risk.is_vpn = pc.vpn;
    risk.is_proxy = risk.is_proxy || pc.proxy;
    risk.is_residential_proxy = pc.residential;
    sources.push("proxycheck");
  } else if (pc === null) failed.push("proxycheck");
  {
    const ab = abEarly;
    if (ab !== null && ab !== undefined) {
      risk.abuse_score = ab;
      risk.is_abuser = ab >= 50;
      sources.push("abuseipdb");
    } else if (ab === null) failed.push("abuseipdb");
  }

  const result: IntelResult = {
    ok: true, ip, private: false, geo, network, risk,
    meta: { cached: false, age_ms: 0, sources_ok: sources.length, sources_failed: failed },
  };
  dbTry(() => {
    d.prepare("INSERT INTO intel_cache(key,ts,ttl_ms,json) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, json=excluded.json")
      .run(cacheKey, Date.now(), CACHE_TTL, JSON.stringify(result));
  }, undefined);
  return result;
}
