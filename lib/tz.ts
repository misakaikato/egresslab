// 时区偏移与平台规范化(纯函数,供检测/评分/测试共用)

// 正确的时区偏移:把 tz 的挂钟时间当作 UTC 解析,差值即偏移(东正西负,分钟)
// 旧实现的"格式化成字符串再按本地解析"会得到 tzoff - lofoff,与系统偏移直接比较必然误报
export function tzOffsetMinutes(tz: string, at: Date = new Date()): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(at);
    const g = (t: string) => parts.find((p) => p.type === t)?.value || "00";
    const hour = g("hour") === "24" ? "00" : g("hour");
    const asUtc = Date.parse(`${g("year")}-${g("month")}-${g("day")}T${hour}:${g("minute")}:${g("second")}Z`);
    if (Number.isNaN(asUtc)) return null;
    return Math.round((asUtc - at.getTime()) / 60000);
  } catch {
    return null;
  }
}

// 系统当前偏移(东正,与上面同号)
export function systemOffsetMinutes(at: Date = new Date()): number {
  return -at.getTimezoneOffset();
}

// 平台粗分桶:UA-CH("macOS"/"Windows"/"Linux"/"Android"/"Chrome OS") 与
// navigator.platform("MacIntel"/"Win32"/"Linux x86_64"/"Linux armv8l" 等)
// 只有跨桶才算矛盾——同桶不同写法是正常组合
export type PlatformBucket = "windows" | "apple" | "unix" | "other";
export function platformBucket(p: string, source: "uach" | "nav"): PlatformBucket {
  const t = (p || "").toLowerCase();
  if (!t) return "other";
  if (t.includes("win")) return "windows";
  if (t.includes("mac") || t.includes("iphone") || t.includes("ipad") || t === "ios" || t.includes("cfnetwork")) return "apple";
  // linux / android / cros / chrome os 全归 unix 桶(Android Chrome 的 platform 就是 "Linux armv8l",同桶正常)
  if (source === "uach" ? t.includes("linux") || t.includes("android") || t.includes("chrome") || t.includes("cros") : t.includes("linux") || t.includes("android") || t.includes("cros") || t.includes("arm"))
    return "unix";
  return "other";
}

export function platformsContradict(uachPlatform: string, navPlatform: string): boolean {
  const a = platformBucket(uachPlatform, "uach");
  const b = platformBucket(navPlatform, "nav");
  return a !== b && a !== "other" && b !== "other";
}
