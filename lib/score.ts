// 六维评分引擎:权重与阈值定义见 specs/2026-10-12-egresslab.md
import type { Dimension, ScoreInput, ScoreResult } from "./types";
import { isSupportedCountry } from "./countries";

const WEIGHTS: Record<Dimension["id"], number> = {
  network: 35,
  exposure: 20,
  reputation: 15,
  consistency: 15,
  browser: 10,
  automation: 5,
};

const norm = (s?: string) => (s || "").trim().toLowerCase();
const upper = (s?: string) => (s || "").trim().toUpperCase();
const isV6 = (ip: string) => ip.includes(":");
const sameFamily = (a: string, b: string) => isV6(a) === isV6(b);

// network 维:出口网络类型 9 档
function dimNetwork(e: ScoreInput): { frac: number; code: string } | { frac: null; code: "pending" } {
  const t = e.risk;
  if (!t) return { frac: null, code: "pending" };
  const warp = norm(e.warp);
  const official = norm(t.officialExit);
  if (t.tor) return { frac: 0, code: "tor" };
  if (t.residentialProxy) return { frac: 0.15, code: "resproxy" };
  if (t.vpn || official === "mullvad") return { frac: 0.35, code: "vpn" };
  if (warp === "on" || warp === "plus") return { frac: 0.45, code: "warp" };
  const i = norm(e.ipType);
  if (t.datacenter || ["idc", "datacenter", "hosting", "cdn", "dns"].some((k) => i.includes(k)))
    return { frac: 0.5, code: "datacenter" };
  if (official === "icloud_relay") return { frac: 0.7, code: "icloudRelay" };
  if (["business", "education", "government"].some((k) => i.includes(k)))
    return { frac: 0.9, code: "business" };
  if (["residential", "mobile"].some((k) => i.includes(k))) return { frac: 1, code: "residential" };
  return { frac: 0.8, code: "unknownType" };
}

// exposure 维:WebRTC 泄漏
function dimExposure(e: ScoreInput): { frac: number | null; code: string } {
  const w = e.webrtc;
  if (!w || w.siteStatus === "checking" || w.siteStatus === "idle") return { frac: null, code: "pending" };
  if (w.siteStatus === "unsupported" || w.siteStatus === "timeout")
    return { frac: null, code: "unsupported" };
  const claudeIp = e.claudeIp || "";
  const ips = Array.from(new Set(w.publicIps.filter(Boolean)));
  if (claudeIp) {
    const sameFam = ips.filter((ip) => sameFamily(ip, claudeIp));
    const diff = sameFam.filter((ip) => ip !== claudeIp);
    if (diff.length) return { frac: 0, code: "leakVsClaude" };
    if (sameFam.length) return { frac: 1, code: "match" };
  }
  if (ips.length) return { frac: 0.9, code: "otherFamily" };
  if (w.siteStatus === "ok") return { frac: 1, code: "noCandidate" };
  return { frac: 0.8, code: "localOnly" };
}

// reputation 维:滥用与黑名单
function dimReputation(e: ScoreInput): { frac: number | null; code: string } {
  const xs = [e.abuse, e.blacklist].filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!xs.length) return { frac: null, code: "pending" };
  const x = Math.max(0, Math.min(1, Math.min(...xs) / 100));
  return x < 0.05 ? { frac: 1, code: "clean" } : { frac: 1 - x, code: "flagged" };
}

// consistency 维:三域名出口 / geo 双源 / v4v6 同国,取最坏
function dimConsistency(e: ScoreInput): { frac: number | null; code: string } {
  const parts: { frac: number; code: string }[] = [];
  const exits = (e.domainExits || []).filter((d) => d.ip);
  if (exits.length >= 2) {
    const sameIp = new Set(exits.map((d) => d.ip)).size === 1;
    parts.push(sameIp ? { frac: 1, code: "domainsSame" } : { frac: 0.3, code: "domainsSplit" });
  }
  const cf = upper(e.cfCountry);
  const db = upper(e.dbCountry);
  if (cf && db) parts.push(cf === db ? { frac: 1, code: "geoAgree" } : { frac: 0.6, code: "geoDisagree" });
  const v4 = upper(e.v4Country);
  const v6 = upper(e.v6Country);
  if (v4 && v6) parts.push(v4 === v6 ? { frac: 1, code: "familySame" } : { frac: 0.5, code: "familySplit" });
  const colo = upper(e.coloCountry);
  const regionNow = upper(cf || db);
  if (colo && regionNow) parts.push(colo === regionNow ? { frac: 1, code: "coloMatch" } : { frac: 0.5, code: "coloMismatch" });
  if (!parts.length) return { frac: null, code: "pending" };
  return parts.reduce((worst, p) => (p.frac < worst.frac ? p : worst));
}

// browser 维:时区一致性 vs CN 环境分,取更差
function tzOffsetMinutes(tz: string): number | null {
  try {
    const now = new Date();
    const s = now.toLocaleString("en-US", { timeZone: tz });
    const asLocal = new Date(s);
    return Math.round((asLocal.getTime() - now.getTime()) / 60000);
  } catch {
    return null;
  }
}

export function timezoneConsistency(browserTz: string, ipTz: string): number | null {
  if (!browserTz || !ipTz) return null;
  const a = tzOffsetMinutes(browserTz);
  const b = tzOffsetMinutes(ipTz);
  if (a === null || b === null) return null;
  return Math.abs(a - b) <= 15 ? 1 : Math.abs(a - b) <= 60 ? 0.6 : 0.2;
}

function dimBrowser(e: ScoreInput): { frac: number | null; code: string } {
  const tz = timezoneConsistency(e.browserTimezone || "", e.ipTimezone || "");
  const cn =
    typeof e.cnScore === "number" ? Math.max(0, Math.min(1, 1 - e.cnScore / 100)) : null;
  if (tz === null && cn === null) return { frac: null, code: "pending" };
  if (tz !== null && (cn === null || tz <= cn))
    return tz >= 0.99 ? { frac: 1, code: "tzMatch" } : { frac: tz, code: tz >= 0.6 ? "tzSameOffset" : "tzMismatch" };
  return { frac: cn, code: cn !== null && cn >= 0.7 ? "cnLow" : "cnHigh" };
}

function dimAutomation(e: ScoreInput): { frac: number | null; code: string } {
  if (e.webdriver === undefined && e.cookieEnabled === undefined && e.swiftShader === undefined && e.platformContradiction === undefined)
    return { frac: null, code: "pending" };
  if (e.webdriver) return { frac: 0, code: "webdriver" };
  if (e.swiftShader) return { frac: 0.1, code: "swiftShader" };
  if (e.platformContradiction) return { frac: 0.2, code: "platformSpoof" };
  if (e.cookieEnabled === false) return { frac: 0.4, code: "cookieOff" };
  return { frac: 1, code: "ok" };
}

const DIM_FUNCS: Record<Dimension["id"], (e: ScoreInput) => { frac: number | null; code: string }> = {
  network: dimNetwork,
  exposure: dimExposure,
  reputation: dimReputation,
  consistency: dimConsistency,
  browser: dimBrowser,
  automation: dimAutomation,
};

function levelOf(score: number, coverage: number): ScoreResult["level"] {
  let lv: ScoreResult["level"] = score >= 80 ? "low" : score >= 60 ? "watch" : score >= 40 ? "high" : "severe";
  if (lv === "low" && coverage < 85) lv = "watch";
  return lv;
}

export function computeScore(e: ScoreInput): ScoreResult {
  const dimensions: Dimension[] = [];
  let num = 0;
  let cov = 0;
  for (const id of Object.keys(WEIGHTS) as Dimension["id"][]) {
    const w = WEIGHTS[id];
    const r = DIM_FUNCS[id](e);
    if (r.frac !== null) {
      num += r.frac * w;
      cov += w;
    }
    dimensions.push({ id, weight: w, frac: r.frac, points: r.frac === null ? 0 : Math.round(r.frac * w), code: r.code });
  }
  let score = cov > 0 ? Math.round((num / cov) * 100) : 0;
  const cf = upper(e.cfCountry);
  const db = upper(e.dbCountry);
  const region = cf || db;
  const regionSource = cf ? "cloudflare" : db ? "database" : "";
  const supported = isSupportedCountry(region);
  let gate: ScoreResult["gate"] = null;
  let level: ScoreResult["level"];
  if (region && !supported) {
    gate = "unsupported";
    score = 0;
    level = "blocked";
  } else if (e.claudeReachable === false) {
    gate = "unreachable";
    score = Math.min(score, 30);
    level = "unreachable";
  } else if (e.challenged) {
    gate = "challenged";
    score = Math.min(score, 60);
    level = levelOf(Math.min(score, 60), cov);
  } else {
    if (cf && db && cf !== db && !isSupportedCountry(db)) {
      gate = "geoConflict";
      score = Math.min(score, 45);
    }
    level = levelOf(score, cov);
  }
  return { score, coverage: cov, level, gate, region, regionSource, supported, dimensions };
}
