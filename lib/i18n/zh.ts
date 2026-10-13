// 中文(基准字典)
const zh: any = {
  meta: { title: "EgressLab · Claude IP 风险自检", desc: "从 Claude 的视角检查你的网络:出口地区、VPN/代理/机房识别、三域名出口一致性、WebRTC 泄漏与浏览器环境。" },
  nav: { brand: "EgressLab", tag: "Claude 出口风险自检" },
  hero: {
    badge: "本地自托管 · 数据不出你的机器",
    title: "Claude 看到的你,是什么样子?",
    desc: "从 Claude 的视角检查当前网络:Claude 看到的出口 IP 是否在官方支持地区、是否为 VPN/代理/机房/WARP 出口、Anthropic 各域名是否走同一出口、WebRTC 是否暴露真实 IP、浏览器环境是否带有中国大陆特征。",
    privacy: "环境特征全部在浏览器本地计算;情报查询仅访问下列明的公开数据源,不向任何第三方上传检测结果。",
    start: "开始检测",
    testing: "检测中…",
    rescan: "重新检测",
    officialStatus: "官方状态",
    officialUnknown: "未知",
  },
  steps: { intel: "IP 情报", path: "出口路径", reach: "连通性", leakEnv: "泄漏与环境" },
  score: {
    title: "环境评分",
    hint: "满分 100,越高越稳",
    levels: { low: "低风险", watch: "需留意", high: "高风险", severe: "极高风险", blocked: "地区不支持", unreachable: "无法连接" },
    coverage: "覆盖 {n}%",
    gates: {
      unsupported: "出口地区不在 Anthropic 官方支持列表,注册与使用直接受限",
      unreachable: "claude.ai 无法连通,先解决网络可达性",
      geoConflict: "Cloudflare 与情报库对出口地区的判定冲突",
    },
    region: "出口地区",
    supported: { yes: "官方支持", no: "不支持" },
  },
  dims: {
    network: { t: "出口网络类型", d: "家宽/移动最稳;机房、WARP、VPN、代理依次扣分" },
    exposure: { t: "真实 IP 暴露", d: "WebRTC 暴露的公网地址与 Claude 出口是否一致" },
    reputation: { t: "IP 信誉", d: "滥用举报与黑名单记录" },
    consistency: { t: "出口一致性", d: "三个 Anthropic 域名出口、双栈与定位是否一致" },
    browser: { t: "浏览器环境", d: "时区与 IP 所在地是否矛盾,大陆环境特征" },
    automation: { t: "自动化与 Cookie", d: "自动化浏览器或禁用 Cookie 会触发人机验证" },
  },
};

zh.dimCodes = {
  tor: "Tor 出口", resproxy: "住宅代理", vpn: "VPN", warp: "WARP", datacenter: "机房/云",
  icloudRelay: "iCloud 专用代理", business: "商企专线", residential: "家宽/移动", unknownType: "未知类型",
  leakVsClaude: "泄漏非 Claude 出口", match: "与出口一致", otherFamily: "异族地址", noCandidate: "无公网候选", localOnly: "仅本地候选", unsupported: "无法检测",
  clean: "记录干净", flagged: "有举报记录", domainsSame: "三域名同出口", domainsSplit: "出口不一致",
  geoAgree: "定位一致", geoDisagree: "定位冲突", familySame: "双栈同国", familySplit: "双栈跨国",
  tzMatch: "时区一致", tzSameOffset: "时区偏差小", tzMismatch: "时区矛盾", cnLow: "大陆特征低", cnHigh: "大陆特征高",
  webdriver: "自动化浏览器", cookieOff: "Cookie 已禁用", ok: "正常", pending: "待检测",
};
zh.path = {
  title: "出口路径",
  browserV4: "浏览器 IPv4", browserV6: "浏览器 IPv6", direct: "本地直连出口", anthropic: "Anthropic 出口",
  ipGeo: "IP 定位比对", family: "IPv4 / IPv6", webrtc: "WebRTC", timezone: "时区 ↔ IP", route: "Claude 分流",
  pending: "待检测", none: "无", same: "一致", diff: "不一致", via: "经", only4: "单栈 IPv4",
};
zh.probes = {
  title: "Anthropic 连通性", web: "claude.ai 网页端", api: "api.anthropic.com · API/Code", console: "platform.claude.com 控制台",
  latency: "延迟", colo: "节点", warpOn: "WARP 开启", warpOff: "WARP 关闭", reachable: "可达", unreachable: "不可达", pending: "待检测",
};
zh.env = {
  title: "大陆环境特征", desc: "7 项信号加权估算(时区/语言/字体/厂商字体/国产浏览器/国产设备/Intl 区域),全部本地计算。",
  scoreLabel: "特征分", level: { high: "高", medium: "中", low: "低" },
  signals: { timezone: "系统时区", language: "浏览器语言", fonts: "中文字体", vendorFonts: "厂商字体", cnBrowser: "国产浏览器", deviceVendor: "国产设备", locale: "Intl 区域" },
  detected: "命中", notDetected: "未命中", privacy: "以上特征不上传。",
};
zh.auto = { title: "自动化与 Cookie", webdriver: "自动化标志", cookie: "Cookie", on: "开", off: "关", ok: "正常", warn: "有异常信号" };
zh.rep = {
  title: "历史信誉库(自建)", desc: "本机 SQLite 记录的查询历史与你的反馈,越用越准。",
  firstSeen: "首次查询", lastSeen: "最近查询", checks: "查询次数", lastScore: "上次评分", none: "该 IP 尚无本地记录",
  feedbackTitle: "使用反馈", feedbackPlaceholder: "例如:注册被封 / 正常使用中…", submit: "提交", thanks: "已记录",
};
zh.cli = {
  title: "终端自查", desc: "跑 Claude Code 的那台机器网页读不到,以下 6 项在终端补齐:",
  items: [
    { label: "出口 IP / 地区 / WARP", note: "Anthropic 亲自看到的出口", cmd: "curl -s https://api.anthropic.com/cdn-cgi/trace | grep -E '^(ip|loc|warp|colo)='" },
    { label: "双栈分流", note: "v4 与 v6 出口不一致即泄漏", cmd: "curl -4 -s https://api.anthropic.com/cdn-cgi/trace | grep '^ip=' && curl -6 -s https://api.anthropic.com/cdn-cgi/trace | grep '^ip='" },
    { label: "系统时区", note: "Claude Code 会读取的那项;TZ 环境变量可覆盖", cmd: "date +%Z%z; readlink /etc/localtime; env | grep '^TZ='" },
    { label: "环境变量泄密面", note: "中转端点 / 代理 / 时区 / 语言", cmd: "env | grep -iE 'anthropic|proxy|^TZ=|lang|lc_'" },
    { label: "DNS 与 hosts 劫持", note: "分流配置的藏身处", cmd: "grep -iE 'claude|anthropic' /etc/hosts; dig +short claude.ai; dig @1.1.1.1 +short claude.ai" },
    { label: "本机代理进程", note: "终端程序不一定吃系统代理,常只认环境变量", cmd: "scutil --proxy; lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -iE 'clash|v2ray|sing|xray|ss-|surge' || true" },
  ],
  copy: "复制", copied: "已复制",
};
zh.sources = { title: "数据源", geo: "地理与网络:ipwho.is · ip-api.com · rdap.org", risk: "风险:Tor 出口表 · DNSBL(barracuda/sorbs) · ThreatFox · StopForumSpam · FireHOL · 可选 proxycheck / AbuseIPDB(env)", cache: "查询结果缓存 1 小时" };
zh.err = { intelFailed: "情报查询失败,信誉维度不计分" };
zh.footer = { privacy: "浏览器环境特征本地计算 · 检测结果不上传", selfhost: "自托管开源实现" };
export type Dict = typeof zh;
export default zh;

zh.chain = {
  title: "Claude 风控链路对照",
  note: "来源:社区开源客户端 + 本机抓包 + 前端字符串提取(三级:实测/开源/静态);端点均需登录态与 client-sha 头组,本工具不调用,仅作环境风险对照。",
  stages: [
    { src: "实测", name: "注册前", ep: "/api/signups/lookup · yoti/age-verification", check: "邮箱/手机状态预检、Yoti 年龄验证", dim: "出口地区 + IP 信誉(本页 网络/信誉维)" },
    { src: "开源", name: "登录/会话", ep: "auth/mfa · session_reattest · trusted_devices", check: "短信因子、WebAuthn 重认证、信任设备", dim: "时区/语言矛盾(本页 浏览器维)" },
    { src: "实测", name: "KYC", ep: "organizations/{org}/kyc_status", check: "Persona 身份核验状态机(not_required→created→verified/denied)", dim: "出口一致性 + 设备指纹" },
    { src: "静态", name: "支付", ep: "billing/gift/purchase_eligibility · overage/checkout", check: "购买资格预检、礼品卡路线、升级 step-up", dim: "IP 信誉 + 账单地区(本页 信誉维)" },
    { src: "实测", name: "运行时", ep: "account/standing · banners · challenge_redirect", check: "封禁/受限状态、风控横幅、人机验证重定向", dim: "自动化/ Cookie(本页 自动化维)" },
  ],
  errorsTitle: "错误码速查",
  errors: [
    { code: "phone_verification_required", meaning: "升级支付时要求手机验证", action: "先过本页检测再重试;号码被标记见下一条" },
    { code: "phone_number_temp_blocked", meaning: "手机号被烧(近期滥用记录)", action: "换号;同一出口反复触发会连带 IP 信誉" },
    { code: "kyc_pending", meaning: "org 级 Persona KYC 挂起", action: "等待核验,期间功能受限" },
    { code: "challenge_redirect 循环", meaning: "反复跳人机验证", action: "典型根因:自动化浏览器/禁 Cookie/机房 IP(对应本页 自动化+网络维)" },
  ],
  deviceId: "网页端每个请求携带 anthropic-device-id 与 client-sha/build 头组:设备 ID 与 IP 无关,但多账号复用同一设备会被关联——与本工具的 IP/环境维度互补,防关联需两层一起换。",
};

zh.score.gates.challenged = "Cloudflare 边缘对 claude.ai 弹出了人机验证——IP 已被边缘标记";
zh.dimCodes.swiftShader = "软件渲染(疑似无头浏览器)";
zh.dimCodes.platformSpoof = "平台伪装矛盾(字体 vs UA)";
zh.dimCodes.coloMatch = "节点与地区一致";
zh.dimCodes.coloMismatch = "节点与地区不符";
zh.path.dns = "DNS 解析";
zh.path.dnsOk = "双源正常";
zh.path.dnsPolluted = "解析出界(污染/劫持)";
zh.path.dnsPartial = "仅单源可用";
zh.path.dnsFailed = "无法检测";
zh.path.ptr = "PTR 一致性";
zh.path.ptrNone = "无 PTR";
zh.path.prefix = "前缀年龄";
zh.path.prefixNew = "新前缀";
zh.path.neighbors = "邻居信誉";
zh.path.safety = { title: "平台预判", ai: "AI 订阅", media: "流媒体", signup: "注册", safe: "稳", caution: "慎", risk: "险", note: "由出口类型与信誉推导的粗略预判,非官方数据" };
zh.auto.spoof = "平台伪装矛盾";

zh.path.exitsCount = "个出口";
zh.path.native = "原生性";
zh.path.nativeYes = "原生(注册国=定位国)";
zh.path.nativeNo = "广播/异地";
zh.path.h24 = "24h 国家切换";
zh.path.h7d = "7 天切换";
zh.path.trail = "国家轨迹";
zh.path.times = "次";
zh.export = { md: "导出 MD", json: "导出 JSON" };
zh.ai = { title: "AI 服务连通包", desc: "主流 AI 平台可达性,全绿说明出口未被 AI 圈整体拉黑:", reachable: "可达" };

zh.mode = { simple: "简明", pro: "专业" };
zh.expand = { open: "展开细节", close: "收起" };
zh.verdicts = {
  headline: {
    blocked: "出口地区不受支持,需更换节点",
    unreachable: "无法连接 claude.ai,先检查网络",
    challenged: "出口已被 Cloudflare 标记,建议更换",
    low: "环境正常,可放心使用",
    watch: "整体正常,个别项建议调整",
    high: "风险偏高,建议按下方指标调整",
    severe: "多项高风险,建议更换网络环境",
  },
  nativeYes: "属地原生", nativeNo: "非原生",
  a: {
    unsupported: "地区不受支持", unsupportedSub: "出口在 {r},不在 Anthropic 官方支持列表",
    unreachable: "claude.ai 不可达", unreachableSub: "网页端连接失败,先解决网络连通",
    challenged: "出口已被标记", challengedSub: "Cloudflare 对该出口弹出人机验证,建议更换",
    tor: "Tor 出口", torSub: "极高风险,登录和注册大概率被拒",
    resproxy: "住宅代理", resproxySub: "代理池地址,高风险",
    vpn: "VPN 出口", vpnSub: "共享出口,更容易触发验证",
    warp: "Cloudflare WARP", warpSub: "Anthropic 可直接识别 WARP 流量",
    datacenter: "机房 IP", datacenterSub: "注册和登录更容易触发验证",
    icloud: "iCloud 专用代理", icloudSub: "苹果中继出口,风险中等",
    business: "商企专线", businessSub: "常见办公网络,风险较低",
    residential: "家宽出口", residentialSub: "常见家庭网络,风险最低",
    unknown: "普通网络类型", unknownSub: "未被标记为 VPN 或机房",
  },
  b: {
    leak: "WebRTC 泄漏真实 IP", leakSub: "暴露了与出口不同的地址,需在浏览器关闭",
    dnsPolluted: "DNS 解析异常", dnsPollutedSub: "解析结果超出正常范围,存在污染或劫持",
    split: "不同域名出口不一致", splitSub: "claude.ai 与 API 走了不同出口",
    family: "双栈出口不同国家", familySub: "IPv4 与 IPv6 归属地不同",
    colo: "接入节点与属地不符", coloSub: "连接位置和 IP 注册地不一致",
    geo: "定位结果不一致", geoSub: "两处数据源给出不同国家",
    multiExit: "存在多个出口", multiExitSub: "不同探测源返回了不同的公网 IP",
    clean: "出口一致,无泄漏", cleanSub: "各入口看到的地址相同",
    partial: "部分项未测", partialSub: "数据不足,可展开看专业视图",
  },
  c: {
    automation: "检测到自动化特征", automationSub: "浏览器呈现无头或伪装迹象",
    cookie: "Cookie 已禁用", cookieSub: "更易触发人机验证",
    tz: "时区与出口不符", tzSub: "时区暴露实际所在地",
    cnHigh: "中文环境特征明显", cnHighSub: "时区、语言等多项指向中文环境",
    clean: "浏览器环境正常", cleanSub: "无自动化特征,时区一致",
    partial: "环境部分项未测", partialSub: "可展开看专业视图",
  },
  d: {
    flagged: "IP 有滥用记录", flaggedSub: "黑名单或举报记录在案",
    switched: "24 小时内切换过国家", switchedSub: "出口国家变动会触发风控",
    neighbors: "同网段有黑名单记录", neighborsSub: "相邻 IP 被标记,段内信誉差",
    freshPrefix: "网段较新", freshPrefixSub: "该出口网段近期才开始宣告",
    aiBlocked: "多个 AI 服务不可达", aiBlockedSub: "出口可能被相关服务限制",
    clean: "记录清白", cleanSub: "无滥用记录,未见异常历史",
    partial: "记录数据不足", partialSub: "查询次数还少,继续使用会积累",
  },
};

zh.history = { title: "检测历史", count: "本机共 {n} 次", empty: "完成两次检测后,这里会显示变化趋势", local: "仅存本机浏览器(localStorage),不上传。" };
zh.fp = {
  title: "浏览器指纹", hash: "指纹 ID", entropy: "估算熵", bits: "位", factors: "因子", more: "更多因子见专业视图",
  unavailableNote: "以下因子不可用(可能被浏览器加固或扩展禁用)",
  local: "全部因子本地计算,哈希不上传。指纹相同意味着跨站可关联——多账号场景应让指纹随环境隔离。",
  pending: "待检测",
  keys: { canvas: "Canvas 渲染", webgl: "WebGL 渲染器", webgl2: "WebGL2 扩展", audio: "音频渲染", audioDetail: "音频设备", fonts: "可探测字体", fontWidths: "字体宽度", screen: "屏幕", geometry: "窗口几何", hardware: "硬件参数", timezone: "时区", language: "首选语言", platform: "平台", codecs: "解码器矩阵", voices: "语音列表", uach: "UA-CH 高熵", emoji: "Emoji 渲染", keyboard: "键盘布局", display: "显示器能力", intl: "Intl 行为", webgpu: "WebGPU", storage: "存储配额", mediaDevices: "媒体设备", connection: "网络类型", timing: "计时精度" },
  lies: { title: "伪装矛盾检测", none: "各因子相互印证,未发现伪装矛盾",
    keys: { platformFonts: "平台与字体矛盾", emojiPlatform: "Emoji 与平台矛盾", webglMismatch: "WebGL 双版本不一致", platformClaim: "平台声明不一致", tzSpoof: "时区被伪装", langSpoof: "语言被伪装", timingReduced: "计时精度被压低(反指纹措施)" } },
};
