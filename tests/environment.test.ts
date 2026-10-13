import { describe, expect, it } from "vitest";
import { cnTimezoneFrac, cnLanguageFrac, cnIntlFrac } from "../lib/detect/environment";

describe("CN 时区计分", () => {
  it("大陆时区满档", () => {
    for (const tz of ["Asia/Shanghai", "Asia/Urumqi", "PRC"]) expect(cnTimezoneFrac(tz)).toBe(1);
  });
  it("港澳 0.6 / 台湾 0", () => {
    expect(cnTimezoneFrac("Asia/Hong_Kong")).toBe(0.6);
    expect(cnTimezoneFrac("Asia/Macau")).toBe(0.6);
    expect(cnTimezoneFrac("Asia/Taipei")).toBe(0);
  });
});

describe("CN 语言计分", () => {
  it("zh-CN 首位 = 1.0", () => {
    expect(cnLanguageFrac(["zh-CN", "zh", "en"])).toBe(1);
  });
  it("en 首位 + zh-CN 其后 = 0.7", () => {
    expect(cnLanguageFrac(["en-US", "zh-CN"])).toBe(0.7);
  });
  it("zh-HK 首位 = 0.5", () => {
    expect(cnLanguageFrac(["zh-HK", "en"])).toBe(0.5);
  });
  it("zh-TW 首位 → 仅命中任意 zh 兜底档 0.4", () => {
    expect(cnLanguageFrac(["zh-TW", "en"])).toBe(0.4);
  });
  it("纯英文 = 0", () => {
    expect(cnLanguageFrac(["en-US", "ja"])).toBe(0);
  });
});

describe("Intl locale 计分", () => {
  it("zh-CN = 1.0, zh-TW = 0.5, en = 0", () => {
    expect(cnIntlFrac("zh-CN")).toBe(1);
    expect(cnIntlFrac("zh-Hans-CN")).toBe(1);
    expect(cnIntlFrac("zh-TW")).toBe(0.5);
    expect(cnIntlFrac("en-US")).toBe(0);
  });
});
