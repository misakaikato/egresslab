// AI 服务连通包:探测主流 AI 平台可达性与出口(检测"这 IP 是否被 AI 圈整体拉黑")
import { probeTrace } from "./trace";
import type { TraceProbe } from "../types";

export const AI_HOSTS = [
  "chatgpt.com",
  "api.openai.com",
  "platform.openai.com",
  "perplexity.ai",
  "grok.com",
  "x.ai",
  "gemini.google.com",
  "mistral.ai",
  "deepseek.com",
  "poe.com",
] as const;

export async function probeAiPack(timeoutMs = 6000): Promise<TraceProbe[]> {
  return Promise.all(AI_HOSTS.map((h) => probeTrace(h, timeoutMs)));
}
