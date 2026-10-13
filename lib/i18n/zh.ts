// 中文(基准字典)
const zh: any = {
  meta: { title: "ExitLens · Claude IP 风险自检", desc: "从 Claude 的视角检查你的网络:出口地区、VPN/代理/机房识别、三域名出口一致性、WebRTC 泄漏与浏览器环境。" },
  nav: { brand: "ExitLens", tag: "Claude 出口风险自检" },
  hero: {
    badge: "本地自托管 · 数据不出你的机器",
    title: "Claude 看到的你,是什么样子?",
    desc: "从 Claude 的视角检查当前网络:Claude 看到的出口 IP 是否在官方支持地区、是否为 VPN/代理/机房/WARP 出口、Anthropic 各域名是否走同一出口、WebRTC 是否暴露真实 IP、浏览器环境是否带有中国大陆特征。",
    privacy: "环境特征全部在浏览器本地计算;情报查询仅访问下列明的公开数据源,不向任何第三方上传检测结果。",
    start: "开始检测",
    testing: "检测中…",
    rescan: "重新检测",
    officialStatus: "Claude 官方服务",
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
    { label: "环境变量泄密面", note: "中转端点 / 代理 / 时区 / 语言;遥测 env 块还回传 arch/shell/terminal", cmd: "env | grep -iE 'anthropic|proxy|^TZ=|lang|lc_'; uname -m; echo $SHELL / $TERM_PROGRAM" },
    { label: "DNS 与 hosts 劫持", note: "分流配置的藏身处", cmd: "grep -iE 'claude|anthropic' /etc/hosts; dig +short claude.ai; dig @1.1.1.1 +short claude.ai" },
    { label: "本机代理进程", note: "终端程序不一定吃系统代理,常只认环境变量", cmd: "scutil --proxy; lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -iE 'clash|v2ray|sing|xray|ss-|surge' || true" },
    { label: "Claude Code 本机暴露面", note: "~/.claude 落盘(命令日志/快照/转录)不受遥测开关影响;仅截取前 8 位", cmd: "jq '{userID: .userID[0:8], numStartups, oauth: (.oauthAccount != null)}' ~/.claude.json 2>/dev/null; ls ~/.claude/bash-commands.log ~/.claude/shell-snapshots 2>/dev/null; echo DISABLE_TELEMETRY=$DISABLE_TELEMETRY" },
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
    { src: "实测", name: "行为遥测", ep: "event_logging/v2 · rum", check: "打字延迟、粘贴长度分桶、api_repeated_paths(重复调用=脚本特征)、daily-visible-ms", dim: "本页不可测——走 UI、勿直打 API、保持日常使用画像" },
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

zh.path.netClass = "网络分类";
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
  title: "浏览器指纹", hash: "指纹 ID", entropy: "估算熵", bits: "位", factors: "因子", more: "更多因子见专业视图", claudeMark: "Claude 采集面", claudeNote: "据社区对 claude.ai 前端信标的公开观测,标记为 C 的因子属于其采集范围",
  unavailableNote: "以下因子不可用(可能被浏览器加固或扩展禁用)",
  local: "全部因子本地计算,哈希不上传。指纹相同意味着跨站可关联——多账号场景应让指纹随环境隔离。",
  pending: "待检测",
  keys: { canvas: "Canvas 渲染", webgl: "WebGL 渲染器", webgl2: "WebGL2 扩展", audio: "音频渲染", audioDetail: "音频设备", fonts: "可探测字体", fontWidths: "字体宽度", screen: "屏幕", geometry: "窗口几何", hardware: "硬件参数", timezone: "时区", language: "首选语言", platform: "平台", codecs: "解码器矩阵", voices: "语音列表", uach: "UA-CH 高熵", emoji: "Emoji 渲染", keyboard: "键盘布局", display: "显示器能力", intl: "Intl 行为", webgpu: "WebGPU", storage: "存储配额", mediaDevices: "媒体设备", connection: "网络类型", timing: "计时精度", apiSurface: "API 存在面", permissions: "权限状态", refresh: "刷新率", topology: "显示器拓扑", textMetrics: "文本度量", scrollbar: "滚动条宽度", math: "数学引擎", webcodecs: "硬件编解码", wasm: "WASM 特性", sdp: "SDP 结构", clockSkew: "时钟偏移", headerOrder: "HTTP 头序", incognito: "无痕迹象", privacySet: "隐私设置" },
  lies: { title: "伪装矛盾检测", none: "各因子相互印证,未发现伪装矛盾",
    keys: { platformFonts: "平台与字体矛盾", emojiPlatform: "Emoji 与平台矛盾", webglMismatch: "WebGL 双版本不一致", platformClaim: "平台声明不一致", tzSpoof: "时区被伪装", langSpoof: "语言被伪装", timingReduced: "计时精度被压低(反指纹措施)", fontsChannel: "字体双通道不一致", clockSkew: "时钟偏差异常" } },
};

zh.statusLevels = { none: "全部正常", minor: "轻微故障", major: "部分中断", critical: "严重故障", maintenance: "维护中", unknown: "未知" };

zh.compStatus = { operational: "正常运行", degraded_performance: "性能降级", partial_outage: "部分中断", major_outage: "严重中断", maintenance: "维护中", offline: "离线" };
zh.compUpdated = "更新于 {t}";

zh.inference = {
  title: "深度研判", note: "以下为证据链推导的二阶结论(启发式,非直接测量),置信度:高=多证据独立指向。",
  conf: { high: "高", medium: "中", low: "低" },
  globalVpn: { title: "全局 VPN,所有流量走同一海外出口", sub: "国内回显端点也返回海外 IP——不是分流,是整机代理" },
  splitProxy: { title: "分流代理,仅境外流量走代理", sub: "国内直连、Claude 走海外出口;若为规则模式,注意漏网域名" },
  cnDirect: { title: "国内直连出口访问 Claude", sub: "Claude 出口在中国大陆——罕见,注意官方地区限制" },
  abroad: { title: "人确实在境外(或环境高度一致)", sub: "时区与出口一致,国内端点也走同一出口" },
  tzDisguise: { title: "人在国内,时区伪装成出口地", sub: "国内端点与出口不同,但时区与出口一致——主动伪装" },
  warp: { title: "正在使用 Cloudflare WARP", sub: "Anthropic 侧可直接识别 WARP 流量" },
  mullvad: { title: "Mullvad VPN 出口", sub: "官方公布的 Mullvad 服务器段" },
  icloud: { title: "iCloud 专用代理", sub: "苹果官方中继,按大致地区分配出口" },
  v6LeakCn: { title: "IPv6 裸奔回国内", sub: "代理只接管 IPv4,IPv6 直连暴露真实所在地" },
  v6Leak: { title: "IPv6 走了另一个出口", sub: "双栈出口国家不一致,增加关联面" },
  sniBlock: { title: "疑似 SNI 阻断(IP 未被封)", sub: "毫秒级失败是连接重置特征;换 SNI 或换链路而非换 IP" },
  pool: { title: "疑似代理池新启用 IP", sub: "前缀新宣告+段内邻居被标记——池方刚上架" },
  antidetect: { title: "反检测浏览器环境", sub: "多项伪装矛盾+代理出口——抗指纹工具在运行(该结论本身也会被 Claude 类风控推出)" },
  hardened: { title: "浏览器隐私加固", sub: "计时精度/canvas/字体通道被限制——Brave、RFP 或扩展" },
  rotation: { title: "出口高频轮换", sub: "7 天内多次换国——代理池自动轮换或临时网络" },
  ideal: { title: "家宽原生环境,当前接近最优", sub: "家宽+原生+老前缀+记录清白+无伪装矛盾" },
  ev: {
    tz: "时区", ipTz: "IP 时区", cnEcho: "国内端点回显", claudeExit: "Claude 出口", colo: "接入节点",
    globalVpnNote: "全部回显源返回同一 IP", splitNote: "国内外端点返回不同 IP",
    orgMatch: "出口组织匹配 {v}", v6Note: "双栈归属国不一致", fastFail: "{ms}ms 内失败(重置特征)",
    dnsOk: "DNS 解析正常", checkOfficial: "官方状态页正常", prefix: "前缀首见", neighbors: "邻居被标记",
    dcFlag: "情报标记为机房", lies: "伪装矛盾 {n} 项", timing: "计时精度被压低", blocked: "被屏蔽因子",
    sw7: "7 天内换国 {n} 次", trail: "国家轨迹", residential: "家宽/移动 ASN", native: "注册国=定位国(原生)",
    clean: "滥用/黑名单记录清白", noLies: "无伪装矛盾",
  },
};

// 推理规则第二批
Object.assign(zh.inference, {
  domainSplitGeo: { title: "Anthropic 域名按国分流", sub: "不同域名出口在不同国家——按域名规则分流的多代理组配置" },
  claudeOnlyExit: { title: "Claude 专用出口", sub: "访问 Anthropic 的流量被单独指定出口,与其余流量不同——固定节点配置" },
  smartRouting: { title: "按目标智能分流", sub: "不同探测源返回不同 IP——流量按目标地址分流" },
  relayApac: { title: "中转架构:入口在亚太,出口注册在海外", sub: "流量经亚太节点进入 Cloudflare,出口 IP 属地却在别处——典型中转代理" },
  coloMismatch: { title: "接入点与出口属地不符", sub: "进入 CF 的位置与 IP 注册国不一致——中转或 anycast 特征" },
  fastPath: { title: "链路质量异常好", sub: "时区在国内、出口在海外,延迟却极低—— premium 线路(如 CN2 GIA)或真实位置接近出口" },
  longChain: { title: "疑似多级代理链", sub: "延迟超过 1.2 秒——链路经过多跳转发" },
  traceBlocked: { title: "trace 被针对性拦截", sub: "域名可达但 cdn-cgi/trace 被过滤——代理或防火墙的过滤规则,连通性结论仅供参考" },
  apiOnlyChallenge: { title: "API 端点被单独标记", sub: "api.anthropic.com 被挑战而网页正常——API Key 使用场景需换出口" },
  webrtcOff: { title: "WebRTC 已被禁用", sub: "无任何公网候选——浏览器加固或扩展关闭了 WebRTC,泄漏面已消除" },
  dohSplit: { title: "DoH 提供商被屏蔽", sub: "加密 DNS 只有部分可达——分流规则未覆盖该域名(直连被阻)" },
  dnsMitm: { title: "DNS 应答被劫持", sub: "DoH 结果超出正常范围——中间人或透明代理在伪造应答" },
  cloudExit: { title: "云厂商出口", sub: "ISP/ASN 命中云服务商特征——机房属性确认,注册登录易触发验证" },
  ptrProxy: { title: "PTR 命名含代理特征", sub: "反向解析域名含 vpn/proxy/tunnel 等关键词" },
  hijackedHome: { title: "疑似被征用的家宽", sub: "家宽 ASN 却带滥用记录——住宅代理网络的中转节点" },
  fpRotating: { title: "指纹轮换 + 出口轮换", sub: "指纹与出口同时在变——反检测浏览器 + 代理池组合,账号关联风险高" },
  fpDrift: { title: "指纹发生漂移", sub: "两次检测指纹不一致——反指纹配置轮换或浏览器更新" },
  fpStableExitRotate: { title: "指纹固定 + 出口轮换", sub: "同一浏览器换不同出口——账号侧指纹稳定但网络画像多变,风控可据此聚类" },
  trendUp: { title: "环境评分呈上升趋势", sub: "近期调整生效,环境在变好" },
  trendDown: { title: "环境评分呈下降趋势", sub: "环境在恶化,对照最近变更排查" },
  stickyExit: { title: "出口粘性强", sub: "48 小时内出口未变——固定 IP 环境,利于账号稳定" },
  redial: { title: "同国换 IP(运营商重拨特征)", sub: "IP 变了但国家不变——家宽重拨/移动网络正常行为,非代理池轮换" },
  mobileEnv: { title: "移动网络环境", sub: "设备与 ASN 均为移动特征——蜂窝出口天然稳定,真人特征强" },
  headlessFarm: { title: "疑似无头浏览器农场", sub: "熵异常低 + 多因子不可用 + 伪装迹象——自动化批量环境" },
});
zh.inference.ev = {
  ...zh.inference.ev,
  echo: "回显源", regGeo: "IP 属地", latency: "延迟", claudeOnlyNote: "其余流量走另一出口",
  coloNote: "colo 为流量实际进入 CF 的位置", fastNote: "国内到欧美直连通常 >150ms",
  chainNote: "多级转发叠加延迟", fallbackOk: "域名可达(favicon)", traceBlockedNote: "cdn-cgi/trace 请求被拦截",
  apiChallengeNote: "API 与网页共用 CF 但策略可独立", webrtcNoCandidate: "STUN 全部无公网候选",
  dohReachable: "可达 DoH", dohNote: "未覆盖域名走直连", outOfRange: "出界应答",
  dnsMitmNote: "真实 DoH 应答不会超出权威范围", org: "ISP/ASN", cloudNote: "命中云厂商关键词",
  ptrNote: "PTR 含「{kw}」关键词", hijackNote: "家宽被代理网络征用时常见此组合",
  fpChanged: "两次检测指纹哈希不同", fpDriftNote: "正常浏览器升级也会改变指纹",
  fpStable: "指纹哈希稳定", stableRotateNote: "建议指纹与出口同批更换", scores: "近四次评分",
  sameExit48: "48h 出口", stickyNote: "固定出口是账号养成的加分项", redialNote: "PPPoE 重拨/基站切换",
  uaMobile: "UA 为移动设备", unavailable: "不可用因子", entropy: "估算熵",
};
zh.inference.coherence = {
  title: "跨层自洽度 {ok}/{n}", subOk: "各层故事一致——风控视角下画像可信", subBad: "存在跨层矛盾,画像有破绽——按证据逐项修复",
  allOk: "时区/指纹/DNS/出口/colo 各层相互印证",
  items: { tzGeo: "时区(国内)与 IP 属地矛盾", spoof: "伪装矛盾 {n} 项", dns: "DNS 应答异常", domainSplit: "域名出口不一致", family: "双栈归属国不一致", multiExit: "多出口并存", colo: "接入点与属地不符" },
};

zh.account = {
  title: "账号体检(需你手动授权)",
  consent: "本卡所有操作需你主动输入/执行:密钥与账号数据仅在本页内存处理,直连 Anthropic,不经本站服务器,不存储、不记录。",
  key: {
    title: "A · API Key 体检",
    run: "检测", valid: "有效", invalidShort: "异常",
    ok: "Key 有效,组织可访问 {n} 个模型",
    invalid: "Key 无效(未通过认证)",
    blocked: "请求被拒(403)——可能是地区封锁或权限不足,对照错误码",
    ratelimit: "触发限流(429)——Key 活跃度高或已被限",
    other: "HTTP {s},对照 Anthropic 文档",
    network: "网络请求失败(出口无法到达 api.anthropic.com?)",
    privacy: "建议使用受限 Key;输入框为密码型,检测完成即清空。",
  },
  login: {
    title: "B · 登录态采集(claude.ai)",
    steps: "在 claude.ai 任一页面按 F12 → Console 粘贴运行下方脚本 → 输出自动复制 → 回到此处粘贴解析。脚本内容完全透明:只读 org/KYC/账号状态/设备 ID,不发送任何请求到站外。",
    copy: "复制采集脚本", copied: "已复制", pasteHere: "在此粘贴控制台输出(JSON)…",
    parse: "解析", org: "组织", kyc: "KYC 状态", device: "设备 ID(截断)", gates: "功能门禁", standing: "账号状态",
  },
};

zh.statusSource = "数据源 status.anthropic.com(Anthropic 官方状态页)· 5 分钟缓存 · 与本站服务无关";
