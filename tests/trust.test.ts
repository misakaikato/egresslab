import { describe, it, expect } from "vitest";
import { computeTrust } from "../lib/server/trust";
import type { IntelResult } from "../lib/types";

function intel(partial: { risk?: Partial<IntelResult["risk"]>; network?: Partial<IntelResult["network"]> }): IntelResult {
  return {
    ok: true, ip: "1.2.3.4", private: false,
    geo: {}, network: partial.network ?? {}, risk: partial.risk ?? {},
    meta: { cached: false, age_ms: 0, sources_ok: 1, sources_failed: [] },
  } as IntelResult;
}

describe("computeTrust", () => {
  it("干净家宽满分纯净", () => {
    const r = computeTrust(intel({ risk: { is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: false, is_residential_proxy: false, is_abuser: false, abuse_score: 0, blacklist_score: 0 }, network: { asn_type: "isp", native: true } }));
    expect(r).not.toBeNull();
    expect(r!.score).toBe(100);
    expect(r!.grade).toBe("pure");
    expect(r!.factors).toHaveLength(0);
  });

  it("Tor 直接高危扣分最重", () => {
    const r = computeTrust(intel({ risk: { is_tor: true, abuse_score: 0, blacklist_score: 0 } }));
    expect(r!.score).toBe(40);
    expect(r!.grade).toBe("fair");
    expect(r!.factors[0]).toMatchObject({ key: "tor", delta: 60 });
  });

  it("机房+代理+滥用叠加扣到底部区间", () => {
    const r = computeTrust(intel({
      risk: { is_datacenter: true, is_proxy: true, is_abuser: true, abuse_score: 80, blacklist_score: 100 },
      network: { asn_type: "hosting" },
    }));
    expect(r!.score).toBeLessThanOrEqual(20);
    expect(r!.grade).toBe("bad");
    // 因子按扣分降序
    const deltas = r!.factors.map((f) => f.delta);
    expect(deltas).toEqual([...deltas].sort((a, b) => b - a));
  });

  it("扣分下限为 0,不为负", () => {
    const r = computeTrust(intel({
      risk: { is_tor: true, is_proxy: true, is_vpn: true, is_residential_proxy: true, is_abuser: true, abuse_score: 100, blacklist_score: 100, neighbors_flagged: 5 },
    }));
    expect(r!.score).toBe(0);
  });

  it("无线情报返回 null", () => {
    expect(computeTrust(intel({}))).toBeNull();
  });

  it("软信号:ASN 托管但未标机房时轻扣", () => {
    const r = computeTrust(intel({ risk: { is_datacenter: false, abuse_score: 0, blacklist_score: 0 }, network: { asn_type: "hosting" } }));
    expect(r!.score).toBe(90);
    expect(r!.factors[0].key).toBe("asnHosting");
  });

  it("新鲜前缀扣分", () => {
    const r = computeTrust(intel({ risk: { abuse_score: 0, blacklist_score: 0, prefix_first_seen: new Date().toISOString() } }));
    expect(r!.factors.some((f) => f.key === "freshPrefix")).toBe(true);
    expect(r!.score).toBe(92);
  });
});
