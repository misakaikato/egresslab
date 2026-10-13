// 建议引擎:从研判结论 + 门控 + 直接信号生成动作清单
// fix=立即处理 / improve=建议优化 / keep=保持现状
import type { Conclusion, InferenceInput } from "./inference";
import type { ScoreResult } from "./types";

export interface AdviceItem {
  tone: "fix" | "improve" | "keep";
  title: string;
  detail?: string;
}

type Rule = { ids: string[]; tone: AdviceItem["tone"]; key: string; cond?: (ctx: Ctx) => boolean };
type Ctx = { ids: Set<string>; score?: ScoreResult; input: InferenceInput };

// 结论 id → 建议(key 引用 i18n advice.a.{key}.title/.detail)
const RULES: Rule[] = [
  { ids: ["globalVpn", "splitProxy"], tone: "improve", key: "proxyForm" },
  { ids: ["v6Leak", "v6LeakCn"], tone: "fix", key: "v6" },
  { ids: ["webrtcProxyGap"], tone: "fix", key: "webrtcGap" },
  { ids: ["dnsMitm"], tone: "fix", key: "dnsHijack" },
  { ids: ["pool", "hijackedHome"], tone: "fix", key: "abandonExit" },
  { ids: ["rotation", "fpRotating"], tone: "fix", key: "stopRotate" },
  { ids: ["warp", "mullvad", "vpn"], tone: "improve", key: "sharedVpn" },
  { ids: ["datacenterExit", "cloudExit"], tone: "improve", key: "preferResidential" },
  { ids: ["patchworkEnv"], tone: "improve", key: "alignIdentity" },
  { ids: ["domainSplitGeo"], tone: "improve", key: "unifyDomains" },
  { ids: ["multiExit", "smartRouting"], tone: "improve", key: "confirmIntent" },
  { ids: ["dohSplit"], tone: "improve", key: "coverDoh" },
  { ids: ["neighbors"], tone: "improve", key: "changeRange" },
  { ids: ["freshPrefix"], tone: "improve", key: "waitMature" },
  { ids: ["asnCollateral"], tone: "improve", key: "rangeNotIp" },
  { ids: ["stickyExit", "lowShare"], tone: "keep", key: "keepStable" },
  { ids: ["registerOk", "ideal"], tone: "keep", key: "ready" },
  { ids: ["incognitoMyth"], tone: "improve", key: "incognitoNo" },
];

export function buildAdvice(input: InferenceInput, score: ScoreResult | undefined, conclusions: Conclusion[], t: any): AdviceItem[] {
  const out: AdviceItem[] = [];
  const ids = new Set(conclusions.map((c) => c.id));
  const ctx: Ctx = { ids, score, input };
  const A = t.advice;

  // 硬性门控最优先
  if (score?.gate === "unsupported") out.push({ tone: "fix", title: A.a.gateRegion.title, detail: A.a.gateRegion.detail });
  else if (score?.gate === "challenged") out.push({ tone: "fix", title: A.a.gateChallenge.title, detail: A.a.gateChallenge.detail });
  else if (score?.gate === "unreachable") out.push({ tone: "fix", title: A.a.gateUnreachable.title, detail: A.a.gateUnreachable.detail });

  // 出口类型基础建议(network 维 code)
  const netCode = score?.dimensions.find((d) => d.id === "network")?.code;
  if (["datacenter", "transit", "cdn"].includes(netCode || "") || ids.has("cloudExit")) {
    if (!out.some((x) => x.title === A.a.preferResidential.title)) out.push({ tone: "improve", title: A.a.preferResidential.title, detail: A.a.preferResidential.detail });
  }

  // 环境与自动化
  if (score) {
    const brw = score.dimensions.find((d) => d.id === "browser");
    if (brw?.code === "tzMismatch" || ids.has("tzDisguise") || ids.has("tzSpoof")) out.push({ tone: "improve", title: A.a.tz.title, detail: A.a.tz.detail });
    if ((input.env?.score ?? 0) >= 31 && brw?.code !== "tzMatch") out.push({ tone: "improve", title: A.a.cnEnv.title, detail: A.a.cnEnv.detail });
    const auto = score.dimensions.find((d) => d.id === "automation");
    if (auto?.code === "cookieOff") out.push({ tone: "improve", title: A.a.cookie.title, detail: A.a.cookie.detail });
    if (auto?.code === "webdriver" || auto?.code === "swiftShader" || ids.has("headlessFarm")) out.push({ tone: "fix", title: A.a.automation.title, detail: A.a.automation.detail });
    if (ids.has("coherence") && conclusions.find((c) => c.id === "coherence")?.tone !== "good") out.push({ tone: "improve", title: A.a.coherence.title, detail: A.a.coherence.detail });
  }

  // 结论映射
  for (const r of RULES) {
    if (r.cond && !r.cond(ctx)) continue;
    if (r.ids.some((id) => ids.has(id))) {
      const item = (A.a as any)[r.key];
      if (item && !out.some((x) => x.title === item.title)) out.push({ tone: r.tone, title: item.title, detail: item.detail });
    }
  }
  if (ids.has("registerNo")) {
    const item = A.a.registerNo;
    if (!out.some((x) => x.title === item.title)) out.push({ tone: "fix", title: item.title, detail: item.detail });
  }

  const order = { fix: 0, improve: 1, keep: 2 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 10);
}
