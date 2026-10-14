// 场景适配评分:把 IP 情报映射到具体使用场景(0-10,越高越适合)
// 参考社区经验:TikTok 对机房 IP 容忍度最低;AI 平台对机房相对宽容但重信誉;社媒居中
import type { IntelResult, TrustResult } from "../types";
import { computeTrust } from "./trust";

export type SceneId = "tiktok" | "social" | "ai";
export type SceneGrade = "excellent" | "recommended" | "usable" | "marginal" | "notRecommended";

export interface SceneScore {
  id: SceneId;
  score: number; // 0-10
  grade: SceneGrade;
}

function gradeOf(s: number): SceneGrade {
  return s >= 9 ? "excellent" : s >= 7 ? "recommended" : s >= 5 ? "usable" : s >= 3 ? "marginal" : "notRecommended";
}

export function sceneScores(intel: IntelResult): SceneScore[] {
  const r = intel.risk || {};
  const n = intel.network || {};
  const trust: TrustResult | null = intel.trust ?? computeTrust(intel);
  const t10 = (trust?.score ?? 50) / 10;
  const dc = !!r.is_datacenter;
  const anon = !!(r.is_tor || r.is_residential_proxy);
  const cloaked = !!(r.is_vpn || r.is_proxy || r.official_exit);
  const nativeOk = n.native !== false;
  const asnType = (n.asn_type || "").toLowerCase();
  const residential = ["isp", "mobile", "business", "education"].some((k) => asnType.includes(k)) && !dc;

  const clamp = (v: number, cap: number) => Math.max(0, Math.min(cap, Math.round(v)));

  // AI 应用:信誉优先,机房可用但不加分
  let ai = t10;
  if (dc) ai = Math.min(ai, 8);
  if (cloaked) ai = Math.min(ai, 5);
  if (anon) ai = Math.min(ai, 2);

  // TikTok:机房零容忍,住宅+原生才有高分
  let tt = t10;
  if (dc) tt = Math.min(tt, 3);
  if (!residential && !dc) tt = Math.min(tt, 6);
  if (!nativeOk) tt -= 1;
  if (cloaked) tt = Math.min(tt, 4);
  if (anon) tt = 1;

  // 社媒运营:居中
  let sm = t10;
  if (dc) sm = Math.min(sm, 6);
  if (!nativeOk) sm -= 1;
  if (cloaked) sm = Math.min(sm, 5);
  if (anon) sm = Math.min(sm, 2);

  return [
    { id: "ai", score: clamp(ai, 10), grade: gradeOf(clamp(ai, 10)) },
    { id: "social", score: clamp(sm, 10), grade: gradeOf(clamp(sm, 10)) },
    { id: "tiktok", score: clamp(tt, 10), grade: gradeOf(clamp(tt, 10)) },
  ];
}
