// 聚合 statuspage.io 格式的服务状态(/api/v2/summary.json),5 分钟内存缓存
export interface StatusIncident {
  name: string;
  status: string;
  impact: string;
  link: string;
}

export interface ServiceStatus {
  id: string;
  name: string;
  group: "ai" | "dev" | "app";
  ok: boolean;
  indicator: string; // none / minor / major / critical / maintenance
  description: string;
  updatedAt: string;
  incidents: StatusIncident[];
  maintenances: StatusIncident[];
}

export const STATUS_SERVICES: { id: string; name: string; host: string; group: ServiceStatus["group"] }[] = [
  { id: "anthropic", name: "Claude (Anthropic)", host: "status.anthropic.com", group: "ai" },
  { id: "openai", name: "OpenAI / ChatGPT", host: "status.openai.com", group: "ai" },
  { id: "deepseek", name: "DeepSeek", host: "status.deepseek.com", group: "ai" },
  { id: "huggingface", name: "Hugging Face", host: "status.huggingface.co", group: "ai" },
  { id: "cloudflare", name: "Cloudflare", host: "www.cloudflarestatus.com", group: "dev" },
  { id: "github", name: "GitHub", host: "www.githubstatus.com", group: "dev" },
  { id: "vercel", name: "Vercel", host: "www.vercel-status.com", group: "dev" },
  { id: "netlify", name: "Netlify", host: "www.netlifystatus.com", group: "dev" },
  { id: "digitalocean", name: "DigitalOcean", host: "status.digitalocean.com", group: "dev" },
  { id: "discord", name: "Discord", host: "discordstatus.com", group: "app" },
  { id: "twilio", name: "Twilio", host: "status.twilio.com", group: "app" },
  { id: "npm", name: "npm", host: "status.npmjs.org", group: "dev" },
  { id: "notion", name: "Notion", host: "www.notion-status.com", group: "app" },
  { id: "figma", name: "Figma", host: "status.figma.com", group: "app" },
  { id: "linear", name: "Linear", host: "status.linear.app", group: "app" },
];

interface CacheEntry {
  at: number;
  data: ServiceStatus[];
}
let cache: CacheEntry | null = null;
const TTL = 5 * 60 * 1000;

async function fetchOne(s: (typeof STATUS_SERVICES)[number]): Promise<ServiceStatus> {
  const base: ServiceStatus = {
    id: s.id, name: s.name, group: s.group, ok: false,
    indicator: "unknown", description: "", updatedAt: "", incidents: [], maintenances: [],
  };
  try {
    const res = await fetch(`https://${s.host}/api/v2/summary.json`, {
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "exitlens-status/1.0" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    base.ok = true;
    base.indicator = j?.status?.indicator || "none";
    base.description = j?.status?.description || "";
    base.updatedAt = j?.page?.updated_at || "";
    base.incidents = (j?.incidents || []).map((i: any) => ({
      name: i?.name || "", status: i?.status || "", impact: i?.impact || "",
      link: i?.shortlink || "",
    }));
    base.maintenances = (j?.scheduled_maintenances || []).map((i: any) => ({
      name: i?.name || "", status: i?.status || "", impact: i?.impact || "",
      link: i?.shortlink || "",
    }));
    return base;
  } catch {
    return base;
  }
}

export async function aggregateStatus(): Promise<{ at: string; services: ServiceStatus[] }> {
  if (cache && Date.now() - cache.at < TTL) return { at: new Date(cache.at).toISOString(), services: cache.data };
  const services = await Promise.all(STATUS_SERVICES.map(fetchOne));
  cache = { at: Date.now(), data: services };
  return { at: new Date(cache.at).toISOString(), services };
}
