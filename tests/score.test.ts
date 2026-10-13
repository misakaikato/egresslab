import { describe, expect, it } from "vitest";
import { computeScore, timezoneConsistency } from "../lib/score";
import type { ScoreInput } from "../lib/types";

const base: ScoreInput = {
  domainExits: [],
  claudeReachable: true,
  cfCountry: "US",
  dbCountry: "US",
  risk: { tor: false, residentialProxy: false, vpn: false, proxy: false, datacenter: false },
  ipType: "isp",
  abuse: 0,
  blacklist: 0,
  webrtc: { publicIps: [], siteStatus: "ok" },
  browserTimezone: "America/New_York",
  ipTimezone: "America/New_York",
  cnScore: 0,
  webdriver: false,
  cookieEnabled: true,
};

describe("network 维 9 档", () => {
  const cases: [Partial<ScoreInput>, number, string][] = [
    [{ risk: { tor: true, residentialProxy: false, vpn: false, proxy: false, datacenter: false } }, 0, "tor"],
    [{ risk: { tor: false, residentialProxy: true, vpn: false, proxy: false, datacenter: false } }, 0.15, "resproxy"],
    [{ risk: { tor: false, residentialProxy: false, vpn: true, proxy: false, datacenter: false } }, 0.35, "vpn"],
    [{ warp: "on" }, 0.45, "warp"],
    [{ risk: { tor: false, residentialProxy: false, vpn: false, proxy: false, datacenter: true } }, 0.5, "datacenter"],
    [{ risk: { tor: false, residentialProxy: false, vpn: false, proxy: false, datacenter: false, officialExit: "icloud_relay" } }, 0.7, "icloudRelay"],
    [{ ipType: "business" }, 0.9, "business"],
    [{ ipType: "residential" }, 1, "residential"],
    [{ ipType: "" }, 0.8, "unknownType"],
  ];
  it.each(cases)("network %#", (patch, frac, code) => {
    const r = computeScore({ ...base, ...patch });
    const dim = r.dimensions.find((d) => d.id === "network")!;
    expect(dim.frac).toBe(frac);
    expect(dim.code).toBe(code);
  });
});

describe("门控", () => {
  it("不支持地区 → 0 分 blocked", () => {
    const r = computeScore({ ...base, cfCountry: "CN", dbCountry: "CN" });
    expect(r.score).toBe(0);
    expect(r.level).toBe("blocked");
    expect(r.gate).toBe("unsupported");
  });
  it("claude 不可达 → ≤30 unreachable", () => {
    const r = computeScore({ ...base, claudeReachable: false });
    expect(r.score).toBeLessThanOrEqual(30);
    expect(r.level).toBe("unreachable");
  });
  it("geo 冲突且库国不支持 → ≤45", () => {
    const r = computeScore({ ...base, cfCountry: "US", dbCountry: "CN" });
    expect(r.score).toBeLessThanOrEqual(45);
    expect(r.gate).toBe("geoConflict");
  });
});

describe("consistency / exposure", () => {
  it("三域名出口不同 → 0.3", () => {
    const r = computeScore({ ...base, domainExits: [
      { host: "claude.ai", ip: "1.1.1.1", country: "US" },
      { host: "api.anthropic.com", ip: "2.2.2.2", country: "US" },
    ] });
    expect(r.dimensions.find((d) => d.id === "consistency")!.code).toBe("domainsSplit");
  });
  it("WebRTC 同族不同 IP → 0 分", () => {
    const r = computeScore({ ...base, claudeIp: "1.1.1.1", webrtc: { publicIps: ["3.3.3.3"], siteStatus: "ok" } });
    expect(r.dimensions.find((d) => d.id === "exposure")!.code).toBe("leakVsClaude");
  });
});

describe("新增维度与门控", () => {
  it("CF 边缘挑战 → min 60 + gate challenged", () => {
    const r = computeScore({ ...base, challenged: true });
    expect(r.score).toBeLessThanOrEqual(60);
    expect(r.gate).toBe("challenged");
  });
  it("swiftShader → automation 0.1", () => {
    const r = computeScore({ ...base, swiftShader: true });
    const d = r.dimensions.find((x) => x.id === "automation")!;
    expect(d.frac).toBe(0.1);
    expect(d.code).toBe("swiftShader");
  });
  it("平台伪装矛盾 → automation 0.2", () => {
    const r = computeScore({ ...base, platformContradiction: true });
    const d = r.dimensions.find((x) => x.id === "automation")!;
    expect(d.frac).toBe(0.2);
    expect(d.code).toBe("platformSpoof");
  });
  it("colo 与地区不符 → consistency 0.5", () => {
    const r = computeScore({ ...base, domainExits: [{ host: "claude.ai", ip: "1.1.1.1", country: "US" }], coloCountry: "HK" });
    const d = r.dimensions.find((x) => x.id === "consistency")!;
    expect(d.frac).toBe(0.5);
    expect(d.code).toBe("coloMismatch");
  });
});

describe("timezoneConsistency", () => {
  it("同偏移 → 1", () => {
    expect(timezoneConsistency("America/New_York", "America/New_York")).toBe(1);
  });
  it("差 12 小时 → 0.2", () => {
    expect(timezoneConsistency("Asia/Shanghai", "America/New_York")).toBe(0.2);
  });
  it("缺输入 → null", () => {
    expect(timezoneConsistency("", "UTC")).toBeNull();
  });
});
