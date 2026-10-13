// 本地库统一接口:一类用途一个接口
// GeoProvider —— 地理定位类(MaxMind / DB-IP / IPInfo / IP2Region / IP2Location)
// PrivacyProvider —— 网络性质类(IPInfo privacy / 任何 usage-type 源)
// 全部懒加载:文件不存在 → available=false → 聚合层静默跳过
import { Reader as MmdbReader } from "maxmind";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { getDb, dbTry } from "../db";

const DB_DIR = path.join(process.cwd(), "data", "db");

export interface LocalGeoHit {
  source: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  lat?: number;
  lon?: number;
  asn?: number;
  asnName?: string;
}

export interface GeoProvider {
  name: string;
  available(): boolean;
  lookup(ip: string): LocalGeoHit | null;
}

// ---- mmdb 系(MaxMind / DB-IP / IPInfo 国家库) ----
function pick(r: any, ...paths: string[]): any {
  for (const p of paths) {
    const v = p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), r);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

class MmdbGeoProvider implements GeoProvider {
  private reader: any = null;
  private tried = false;
  constructor(public name: string, private file: string, private kind: "city" | "country" | "asn") {}
  available(): boolean {
    if (!this.tried) {
      this.tried = true;
      const p = path.join(DB_DIR, this.file);
      if (existsSync(p)) {
        try {
          // maxmind v5 无同步 open,Reader 直接吃 buffer
          const buf = readFileSync(p);
          const R: any = MmdbReader as any;
          this.reader = new R(buf);
        } catch (e) {
          console.error(`[local-db] ${this.name} open failed`, e);
        }
      }
    }
    return !!this.reader;
  }
  lookup(ip: string): LocalGeoHit | null {
    if (!this.available()) return null;
    let r: any;
    try {
      r = this.reader.get(ip);
    } catch {
      return null;
    }
    if (!r) return null;
    if (this.kind === "asn") {
      const asn = pick(r, "autonomous_system_number");
      if (asn === undefined) return null;
      return { source: this.name, asn: Number(asn) || undefined, asnName: pick(r, "autonomous_system_organization") };
    }
    const country = pick(r, "country.iso_code", "registered_country.iso_code", "country", "country_code");
    if (!country) return null;
    return {
      source: this.name,
      country: String(country).toUpperCase().slice(0, 2),
      region: pick(r, "subdivisions.0.iso_code", "region", "region_code", "province"),
      city: pick(r, "city.names.en", "city.name.en", "city", "city_name"),
      timezone: pick(r, "location.time_zone", "timezone", "time_zone"),
      lat: Number(pick(r, "location.latitude", "latitude")) || undefined,
      lon: Number(pick(r, "location.longitude", "longitude")) || undefined,
    };
  }
}

// ---- IP2Region(中国精度优先,纯 JS xdb) ----
class Ip2RegionProvider implements GeoProvider {
  private query: any = null;
  private tried = false;
  readonly name = "ip2region";
  available(): boolean {
    if (!this.tried) {
      this.tried = true;
      // 优先 data/db/ip2region.db(v2 格式,手动覆盖位),否则用 npm 包自带库
      const candidates = [path.join(DB_DIR, "ip2region.db"), path.join(process.cwd(), "node_modules", "ip2region", "data", "ip2region.db")];
      const p = candidates.find((c) => existsSync(c));
      if (p) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const mod: any = require("ip2region");
          const IP2Region = mod.default || mod.IP2Region || mod;
          this.query = new IP2Region({ ipv4db: p, disableIpv6: true });
        } catch (e) {
          console.error("[local-db] ip2region open failed", e);
        }
      }
    }
    return !!this.query;
  }
  lookup(ip: string): LocalGeoHit | null {
    if (!this.available() || ip.includes(":")) return null;
    try {
      const r = this.query.search(ip);
      if (!r) return null;
      return { source: this.name, country: r.country === "中国" ? "CN" : r.country === "0" ? undefined : r.country, region: r.province !== "0" ? r.province : undefined, city: r.city !== "0" ? r.city : undefined };
    } catch {
      return null;
    }
  }
}

// ---- IP2Location(CSV 导入 SQLite 区间表) ----
class Ip2LocationProvider implements GeoProvider {
  readonly name = "ip2location";
  available(): boolean {
    return dbTry(() => {
      const row = getDb().prepare("SELECT COUNT(*) AS c FROM ip2location_ranges").get() as any;
      return row && row.c > 0;
    }, false);
  }
  lookup(ip: string): LocalGeoHit | null {
    if (ip.includes(":")) return null;
    const n = ip.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
    const row = dbTry(
      () => getDb().prepare("SELECT country_code, region_name, city_name, timezone FROM ip2location_ranges WHERE start_num <= ? AND end_num >= ? ORDER BY start_num DESC LIMIT 1").get(n, n) as any,
      undefined
    );
    if (!row) return null;
    return { source: this.name, country: row.country_code, region: row.region_name || undefined, city: row.city_name || undefined, timezone: row.timezone || undefined };
  }
}

// 注册表:同类用途在此增删
export const GEO_PROVIDERS: GeoProvider[] = [
  new Ip2RegionProvider(),
  new MmdbGeoProvider("maxmind-city", "GeoLite2-City.mmdb", "city"),
  new MmdbGeoProvider("maxmind-asn", "GeoLite2-ASN.mmdb", "asn"),
  new MmdbGeoProvider("dbip-city", "dbip-city-lite.mmdb", "city"),
  new MmdbGeoProvider("ipinfo-country", "ipinfo-country.mmdb", "country"),
  new Ip2LocationProvider(),
];

export function lookupLocalGeo(ip: string): LocalGeoHit[] {
  const hits: LocalGeoHit[] = [];
  for (const p of GEO_PROVIDERS) {
    try {
      const h = p.lookup(ip);
      if (h) hits.push(h);
    } catch {}
  }
  return hits;
}

// ---- 网络性质类(IPInfo privacy mmdb) ----
export interface LocalPrivacyHit {
  source: string;
  vpn?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  tor?: boolean;
  usageType?: string;
}

export function lookupLocalPrivacy(ip: string): LocalPrivacyHit[] {
  const hits: LocalPrivacyHit[] = [];
  const p = path.join(DB_DIR, "ipinfo-privacy.mmdb");
  if (!existsSync(p)) return hits;
  try {
    const R: any = MmdbReader as any;
    const reader: any = new R(readFileSync(p));
    const r = reader(ip);
    if (r) {
      hits.push({
        source: "ipinfo-privacy",
        vpn: pick(r, "is_vpn", "vpn") === true,
        proxy: pick(r, "is_proxy", "proxy") === true,
        hosting: pick(r, "is_hosting", "hosting") === true,
        tor: pick(r, "is_tor", "tor") === true,
      });
    }
  } catch {}
  return hits;
}

export function localDbStatus(): { name: string; ok: boolean }[] {
  return GEO_PROVIDERS.map((p) => ({ name: p.name, ok: p.available() }));
}
