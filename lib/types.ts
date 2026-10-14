// 共享类型:客户端检测快照 → 评分输入 → 服务端情报
export type Locale = "zh" | "en" | "ja";

export interface TraceProbe {
  host: string;
  status: "pending" | "ok" | "failed";
  ip: string;
  country: string; // CF loc, e.g. "US"
  warp: string; // "" | "off" | "on" | "plus"
  colo: string;
  ms: number;
  fallback: boolean; // true = 仅 favicon 连通性探测
  httpStatus: number;
  challenged: boolean; // CF 边缘 403/503 挑战
}

export interface IntelGeo {
  country_code: string;
  country_en: string;
  city: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  sources?: { source: string; country: string; city: string; latitude: number | null; longitude: number | null }[]; // 多源定位对比
  max_distance_km?: number; // 各源坐标间最大偏移(城市级库打架=风险信号)
}

export interface IntelNetwork {
  asn: number | null;
  asn_name: string;
  asn_type: string; // isp | hosting | business | education | government | mobile | unknown
  isp: string;
  ptr?: { host: string; match: boolean | null }; // 正反向 DNS 一致性
  native?: boolean | null; // 原生 IP:注册国=定位国
  pdb_type?: string; // PeeringDB 分类(NSP/ISP/Content...)
  asn_detail?: { holder: string; prefixes_v4: number; prefixes_v6: number }; // RIPEstat as-overview
  upstreams?: { asn: number; name: string; share: number; tier1: boolean }[]; // BGP 直接上游,share 为百分比
}

export interface IntelRisk {
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_datacenter: boolean;
  is_residential_proxy: boolean;
  is_abuser: boolean;
  official_exit: string | null; // "mullvad" | "icloud_relay" | null
  abuse_score: number; // 0-100
  blacklist_score: number; // 0-100
  prefix_first_seen?: string | null; // BGP 前缀首次宣告(RIPEstat)
  neighbors_flagged?: number; // 同 /24 邻居被标记数
  dnsbl_detail?: { zone: string; name: string; cat: string; listed: boolean; ms: number }[]; // 12 区 DNSBL 明细
  open_ports?: number[] | null; // 常见端口探测(自托管启用;null=未测)
  sources: string[];
}

export interface TrustFactor {
  key: string; // i18n 键:tor / proxy / vpn / datacenter / abuse / blacklist ...
  delta: number; // 扣分(正数)
  value?: string; // 附带值(如 abuse 分数)
}

export interface TrustResult {
  score: number; // 0-100,越高越纯净
  grade: "pure" | "good" | "fair" | "poor" | "bad";
  factors: TrustFactor[];
}

export interface IntelResult {
  ok: boolean;
  ip: string;
  private: boolean;
  geo: Partial<IntelGeo>;
  network: Partial<IntelNetwork>;
  risk: Partial<IntelRisk>;
  trust?: TrustResult; // 单值纯净度评分(服务端聚合后计算)
  meta: { cached: boolean; age_ms: number; sources_ok: number; sources_failed: string[] };
}

export interface EnvSignal {
  key: string;
  weight: number;
  frac: number; // 0-1
  score: number; // frac*weight 四舍五入
  value: string;
  pass: boolean;
}

export interface EnvResult {
  collected: boolean;
  timezone: string;
  languages: string;
  cookie: boolean;
  webdriver: boolean;
  webglRenderer: string;
}

export interface WebRtcResult {
  status: "idle" | "checking" | "ok" | "unsupported" | "timeout";
  publicIps: string[];
}

export interface ScoreInput {
  claudeIp?: string;
  claudeReachable?: boolean; // undefined=未测
  cfCountry?: string;
  dbCountry?: string;
  warp?: string;
  domainExits: { host: string; ip: string; country: string }[];
  v4Country?: string;
  v6Country?: string;
  risk?: {
    tor: boolean;
    residentialProxy: boolean;
    vpn: boolean;
    proxy: boolean;
    datacenter: boolean;
    officialExit?: string;
  };
  ipType?: string; // asn_type 小写化后的网络类型
  abuse?: number;
  blacklist?: number;
  webrtc?: { publicIps: string[]; siteStatus: WebRtcResult["status"] };
  swiftShader?: boolean; // 无头浏览器软件渲染
  platformContradiction?: boolean; // UA 平台与字体矛盾
  coloCountry?: string; // CF 节点所在国(部分已知节点)
  challenged?: boolean; // claude.ai 边缘被挑战
  browserTimezone?: string;
  ipTimezone?: string;
  cnScore?: number;
  webdriver?: boolean;
  cookieEnabled?: boolean;
}

export interface Dimension {
  id: "network" | "exposure" | "reputation" | "consistency" | "browser" | "automation";
  weight: number;
  frac: number | null;
  points: number;
  code: string;
}

export interface ScoreResult {
  score: number;
  coverage: number; // 已测维度权重和
  level: "low" | "watch" | "high" | "severe" | "blocked" | "unreachable";
  gate: "unsupported" | "unreachable" | "challenged" | "geoConflict" | null;
  region: string; // 判定用国家
  regionSource: "cloudflare" | "database" | "";
  supported: boolean | undefined;
  dimensions: Dimension[];
}

export interface DnsCheckLike {
  status: "ok" | "partial" | "failed";
  polluted: boolean | null;
  outOfRange: string[];
  providers?: string[];
}
