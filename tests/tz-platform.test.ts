import { describe, expect, it } from "vitest";
import { tzOffsetMinutes, systemOffsetMinutes, platformBucket, platformsContradict } from "../lib/tz";

describe("时区偏移(修2:旧实现差一个本地偏移)", () => {
  const jul = new Date("2026-07-01T12:00:00Z");
  const jan = new Date("2026-01-15T12:00:00Z");
  it("伦敦夏令时 +60 / 冬令时 0", () => {
    expect(tzOffsetMinutes("Europe/London", jul)).toBe(60);
    expect(tzOffsetMinutes("Europe/London", jan)).toBe(0);
  });
  it("上海恒 +480,洛杉矶夏 +420 / 冬 +480", () => {
    expect(tzOffsetMinutes("Asia/Shanghai", jul)).toBe(480);
    expect(tzOffsetMinutes("America/Los_Angeles", jul)).toBe(-420);
    expect(tzOffsetMinutes("America/Los_Angeles", jan)).toBe(-480);
  });
  it("非法时区 → null", () => {
    expect(tzOffsetMinutes("Not/AZone")).toBeNull();
  });
  it("系统偏移与 Intl 同 tz 时应一致(在任何机器上)", () => {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localTz) expect(tzOffsetMinutes(localTz)).toBe(systemOffsetMinutes());
  });
});

describe("平台分桶(修1:macOS/MacIntel 是正常组合)", () => {
  it("正常组合不报矛盾", () => {
    expect(platformsContradict("macOS", "MacIntel")).toBe(false);
    expect(platformsContradict("Windows", "Win32")).toBe(false);
    expect(platformsContradict("Windows", "Win64")).toBe(false);
    expect(platformsContradict("Linux", "Linux x86_64")).toBe(false);
    expect(platformsContradict("Android", "Linux armv8l")).toBe(false);
    expect(platformsContradict("Chrome OS", "Linux armv8l")).toBe(false);
  });
  it("跨桶组合报矛盾", () => {
    expect(platformsContradict("macOS", "Win32")).toBe(true);
    expect(platformsContradict("Windows", "MacIntel")).toBe(true);
    expect(platformsContradict("macOS", "Linux x86_64")).toBe(true);
  });
  it("空值不报", () => {
    expect(platformsContradict("", "Win32")).toBe(false);
    expect(platformsContradict("Windows", "")).toBe(false);
  });
  it("桶归位抽查", () => {
    expect(platformBucket("macOS", "uach")).toBe("apple");
    expect(platformBucket("iPhone", "nav")).toBe("apple");
    expect(platformBucket("Win64", "nav")).toBe("windows");
  });
});
