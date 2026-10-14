import { describe, it, expect } from "vitest";
import { dnsblScoreFromHits, DNSBL_ZONES } from "../lib/server/intel/geo";
import { sceneScores } from "../lib/server/scenarios";
import type { IntelResult } from "../lib/types";

function intel(partial: { risk?: Partial<IntelResult["risk"]>; network?: Partial<IntelResult["network"]> }): IntelResult {
  return {
    ok: true, ip: "1.2.3.4", private: false,
    geo: {}, network: partial.network ?? {}, risk: partial.risk ?? {},
    meta: { cached: false, age_ms: 0, sources_ok: 1, sources_failed: [] },
  } as IntelResult;
}

describe("dnsblScoreFromHits", () => {
  it("无命中 0 分", () => {
    const r = dnsblScoreFromHits(DNSBL_ZONES.map((z) => ({ zone: z.zone, name: z.name, cat: z.cat, listed: false, ms: 1 })));
    expect(r.score).toBe(0);
    expect(r.hitZones).toHaveLength(0);
  });
  it("Spamhaus 命中权重最高", () => {
    const hits = DNSBL_ZONES.map((z) => ({ zone: z.zone, name: z.name, cat: z.cat, listed: z.zone === "zen.spamhaus.org", ms: 1 }));
    expect(dnsblScoreFromHits(hits).score).toBe(50);
  });
  it("多命中累计封顶 100", () => {
    const hits = DNSBL_ZONES.map((z) => ({ zone: z.zone, name: z.name, cat: z.cat, listed: true, ms: 1 }));
    expect(dnsblScoreFromHits(hits).score).toBe(100);
  });
  it("清单为 12 区且分类齐全", () => {
    expect(DNSBL_ZONES).toHaveLength(12);
    const cats = new Set(DNSBL_ZONES.map((z) => z.cat));
    for (const c of ["spam", "reputation", "botnet", "malware", "proxy"]) expect(cats.has(c as any)).toBe(true);
  });
});

describe("sceneScores", () => {
  const cleanResidential = intel({
    risk: { is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: false, is_residential_proxy: false, is_abuser: false, abuse_score: 0, blacklist_score: 0 },
    network: { asn_type: "isp", native: true },
  });
  it("纯净家宽三场景全高分", () => {
    const s = sceneScores(cleanResidential);
    for (const sc of s) expect(sc.score).toBeGreaterThanOrEqual(9);
  });
  it("机房 IP:TikTok 最低,AI 相对宽容", () => {
    const dc = intel({
      risk: { is_datacenter: true, abuse_score: 0, blacklist_score: 0 },
      network: { asn_type: "hosting", native: true },
    });
    const s = Object.fromEntries(sceneScores(dc).map((x) => [x.id, x.score]));
    expect(s.tiktok).toBeLessThanOrEqual(3);
    expect(s.ai).toBeGreaterThan(s.tiktok);
    expect(s.ai).toBeLessThanOrEqual(8);
  });
  it("Tor/住宅代理:所有场景极低", () => {
    const tor = intel({ risk: { is_tor: true, abuse_score: 0, blacklist_score: 0 } });
    const s = Object.fromEntries(sceneScores(tor).map((x) => [x.id, x.score]));
    expect(s.tiktok).toBe(1);
    expect(s.ai).toBeLessThanOrEqual(2);
    expect(s.social).toBeLessThanOrEqual(2);
  });
  it("分数与档位一致", () => {
    for (const sc of sceneScores(cleanResidential)) {
      expect(sc.score).toBeGreaterThanOrEqual(0);
      expect(sc.score).toBeLessThanOrEqual(10);
      expect(["excellent", "recommended", "usable", "marginal", "notRecommended"]).toContain(sc.grade);
    }
  });
});
