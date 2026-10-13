# 规格:ExitLens — Claude IP 风险自检工具(自托管)

## 背景与目标
自托管 Web 工具:浏览器端检测当前网络在 Claude/Anthropic 风控视角下的风险(出口 IP、VPN/代理/机房识别、三域名出口一致性、WebRTC 泄漏、时区/语言/字体等浏览器环境、自动化特征),服务端聚合多源免费 IP 情报,输出 0–100 评分与 6 维明细。

差异化要求:Next.js 15 + Tailwind 自有视觉(暖纸底/陶土橙/衬线大标题,与原站 Google Sans + 蓝绿卡片风明显区分);多语言 zh(默认)/en/ja;自建历史信誉库(SQLite);预留蜜罐查询与上报接口。

成功标准:本地 `npm run build && npm start` 后浏览器可完成完整检测出分;全部 API 可 curl 复现;评分门控有单元测试。

## 非目标
- 不做账号系统、排行榜、留言、广告、PoW 防刷
- 不做其他工具页(whois/dns/speedtest 等),仅 Claude 检测一页
- 不接付费数据源;PROXYCHECK_API_KEY / ABUSEIPDB_API_KEY 仅作可选增强(env 未配置则该源静默跳过)
- 不做 SEO 优化(页面 noindex 即可)

## 假设
1. 三语:zh-CN 默认,en、ja;`/` 由 middleware 302 到 `/zh`。
2. 存储:Node 内置 `node:sqlite`(DatabaseSync)单文件 `data/exitlens.db`,启动时自动建目录建表;data/ 整体 gitignore。
3. MVP 免费源:ipwho.is(geo+ASN)、ip-api.com(geo+proxy/hosting/mobile 旗标)、rdap.org(注册机构名)、Tor 官方出口表(check.torproject.org/torbulkexitlist)、DNSBL(b.barracudacentral.org + dnsbl.sorbs.net,尽力而为)。
4. Mullvad 识别不依赖列表:ASN/org/ISP 匹配 /mullvad/i 即 official_exit='mullvad';iCloud 专用代理同理匹配 org 文本。
5. Tor 列表优先读 `data/lists/tor-exits.txt`(scripts/update-tor.sh 产出),无文件在线拉取并缓存 24h(intel_cache 表)。
6. Claude 官方状态:status.anthropic.com/api/v2/summary.json,服务端代理,缓存 5 分钟。
7. 蜜罐为预留接口:GET 查询始终可用(初始空数据);POST 上报需请求头 X-Sensor-Key 与 env HONEYPOT_KEY 匹配,未配置返回 503。
8. 依赖白名单:next/react/react-dom/lucide-react/clsx;dev: typescript、@types/*、tailwindcss@3、postcss、autoprefixer、vitest。

## 现状
全新项目,无既有代码。评分权重与检测流程为本规格自定义设计,已固化于此,直接按规格施工。

## 设计
### 数据模型(SQLite,data/exitlens.db)
- rep_ip(ip TEXT PK, first_seen INT, last_seen INT, check_count INT DEFAULT 0, last_score INT, last_result_json TEXT)
- rep_events(id INTEGER PK AUTOINCREMENT, ip TEXT, ts INT, kind TEXT CHECK(kind IN('check','feedback','drift')), note TEXT, score INT)
- honeypot_hits(id INTEGER PK AUTOINCREMENT, ts INT, src_ip TEXT, sensor TEXT, proto TEXT, detail TEXT)
- intel_cache(key TEXT PK, ts INT, ttl_ms INT, json TEXT)

### 接口定义
GET /api/ip/{ip}
- 200 {ok:true, ip, private:bool, geo:{country_code,country_en,city,timezone,latitude,longitude}, network:{asn,asn_name,asn_type,isp}, risk:{is_vpn,is_proxy,is_tor,is_datacenter,is_residential_proxy,is_abuser,official_exit:string|null, abuse_score:int, blacklist_score:int, sources:[string]}, meta:{cached:bool, age_ms, sources_ok:int, sources_failed:[string]}}
- 400 {ok:false,error:'invalid_ip'}(非 IPv4/IPv6 字面量)
- 502 {ok:false,error:'all_sources_failed'}(ipwho 与 ip-api 均失败且无缓存)
- 缓存 1h;成功查询写 rep_ip(upsent)+rep_events('check');risk 旗标取多源最坏值;abuse_score 0-100

GET /api/claude/status → 200 {ok:bool, indicator, description, components:[{name,status}], fetched_at};上游失败时 ok:false,HTTP 仍 200,前端显示"未知"。

GET /api/reputation?ip=x → {ok, ip, known, first_seen, last_seen, check_count, last_score, feedback:[{ts,note,score}](最近10条 feedback 事件)}
POST /api/reputation {ip, note} → 插入 kind='feedback' 事件(note ≤200 字符)→ {ok:true};IP 非法 400

GET /api/honeypot?ip=x → {ok, ip, known:bool, hits:int, first_seen, last_seen, types:[proto 去重]}
POST /api/honeypot 头 X-Sensor-Key,body {src_ip, sensor, proto, detail} → 未配置 HONEYPOT_KEY:503;key 不符:401;成功 200 {ok:true};src_ip 非法 400

### 核心流程(浏览器端,用户点击"开始检测"后;页面绝不自动检测)
1. 并行 trace 探测 claude.ai / api.anthropic.com / platform.claude.com:fetch `https://{host}/cdn-cgi/trace?_t=`,解析 ip/loc/warp/colo(正则 ^key=(.+)$ 多行);失败→favicon.ico Image 探测仅判连通(6s 超时,12s 用于 trace)
2. 直连出口:依次尝试 https://cnip.pancdn.net/、https://124.222.230.137/(取 JSON 的 ip 字段,12s),全败→https://ipwho.is/(取 .ip)
3. 双栈:https://ipv4.ipwho.is/ 与 https://ipv6.ipwo.is/(各自 6s,失败静默留空)
4. IP 情报:GET /api/ip/{claudeExitIp || directIp || webrtcIPv4},失败→评分中 reputation 维 pending
5. WebRTC:RTCPeerConnection(data channels 关),5 个 STUN(stun.l/stun1/stun2.google.com:19302、stun.cloudflare.com:3478、global.stun.twilio.com:3478),收集 srflx 候选公网 IP(v4/v6 去重),8s 上限;API 不存在→'unsupported'
6. 浏览器环境 7 信号(全部本地计算,不上传):
   - 时区(权重30):Asia/Shanghai|Urumqi|Chongqing|Chungking|Harbin|Kashgar|PRC=1.0;Asia/Hong_Kong|Macau=0.6;其余 0
   - 语言(22):languages 全小写;zh-cn 首位=1.0;zh-hk/zh-mo 首位=0.5;任意位置 zh-cn/hans=0.7;任意 zh=0.4;zh-tw 不计
   - 中文字体(14):Canvas 72px measureText 宽度差>0.5 判存在;简体字体列表按 OS 预装表排除(mac 排除 PingFang SC 等/Windows 排除微软雅黑宋体等/Linux+Android 排除 Noto CJK);剩余非预装≥2=1.0、1个=0.8;Windows 预装外出现黑体/楷体/仿宋/等线=0.2;繁体字体不计
   - 厂商字体(12):MiSans/MIUI/HarmonyOS Sans SC/HarmonyOS Sans/HONOR Sans/OPPO Sans/vivo Sans/Alibaba PuHuiTi/Alibaba Sans/DingTalk JinBuTi/Douyin Sans/HYQiHei/FZShuSong-Z01S/FZKai-Z03S/FZHei-B01S/FZFangSong-Z02S;≥2=1.0、1=0.8
   - 国产浏览器(10):UA 正则表(微信/QQ/夸克/UC/百度/小米/华为/OPPO/vivo/搜狗/遨游/360/2345/猎豹/世界之窗/抖音头条/支付宝/钉钉/微博/小红书/B站)
   - 国产设备(6):UA-CH getHighEntropyValues(['model','platform']) + UA 匹配(鸿蒙=1.0、华为荣耀/魅族=0.8、中兴=0.7、小米/OPPO/vivo/realme/一加=0.6、联想=0.5)
   - Intl 区域(6):resolvedOptions().locale 为 zh-cn/zh-hans/zh=1.0;其他 zh=0.5
   总分=各信号 frac×权重求和(0-100);≥61 high、≥31 medium、else low
7. 自动化:navigator.webdriver、navigator.cookieEnabled
8. 评分(6 维,加权平均×100,frac=null 的维度不计入分子分母):
   - network(35):tor=0;residential_proxy=0.15;vpn=0.35;warp=on/plus=0.45;datacenter/idc/hosting/cdn=0.5;icloud_relay=0.7;business/education/government=0.9;residential/mobile=1.0;其余=0.8
   - exposure(20):WebRTC 公网 IP 与 Claude 出口同 IP=1.0;同族不同 IP=0;仅泄漏非 Claude 出口=0;仅 mDNS 本地候选=0.8;异族 IP=0.9;无候选=1.0;unsupported→null
   - reputation(15):x=min(abuse,blacklist)/100;x<0.05→1.0;否则 1-x;无数据→null
   - consistency(15):三域名出口 IP 全同=1.0、出现不同=0.3;trace loc 与库 geo 同国=1.0、异=0.6;v4/v6 同国=1.0、异=0.5;取最坏;无任何可比项→null
   - browser(10):min(IP 时区与浏览器时区偏移一致性, 1-cnScore/100);tz 一致=1.0(偏移分钟相同),不一致=0.2;两项均无→null
   - automation(5):webdriver=true→0;cookieEnabled=false→0.4;否则 1.0
   门控(优先级从高到低):出口国(CF loc||库 geo)∉ Anthropic 支持国家表→score=0,level='blocked';claude.ai 不可达→score=min(score,30),level='unreachable';CF 国与库国冲突且库国亦不支持→score=min(score,45),level 不变
   level:score≥80→'low'(coverage<85→'watch');≥60 'watch';≥40 'high';<40 'severe'
9. 完成后 GET /api/reputation?ip={出口IP} 渲染历史;POST 反馈按钮

## 边界情况
- WebRTC 不支持/超时→exposure 维 null,UI 显示"无法检测"
- 三 trace 全失败→连通区 unreachable,门控生效;intel 用直连 IP 兜底
- ip-api 限流→标记 sources_failed 继续;两个 geo 源全败且无缓存→502
- 私网/保留地址(10/8、172.16/12、192.168/16、127/8、::1、fc00::/7 等)→ /api/ip 直接返回 {ok:true,private:true,geo/network/risk 为空对象}
- DNSBL 查询异常→blacklist_score=0,sources 不含 dnsbl
- SQLite 写失败→console.error 降级,不影响接口 200
- /api/honeypot POST body 缺字段→400
- locale 非法(/xx)→middleware 302 /zh(保留后续路径)
- ipwho.is 返回 success:false→视为该源失败

### 实施步骤
1. 脚手架:package.json/tsconfig/next.config/postcss/tailwind.config/middleware/.gitignore/.env.example,空页面 build 通过
2. lib 基础:lib/types.ts、lib/countries.ts(支持国家表)、lib/score.ts、lib/i18n/{config,zh,en,ja}.ts + tests/{score,environment}.test.ts,`npx vitest run` 全绿
3. lib/detect 六模块:trace/direct/webrtc/environment/automation/dualstack
4. lib/server:db.ts(node:sqlite 建表)、intel/{lists,geo,aggregate}.ts、app/api/ip/[ip]/route.ts、app/api/claude/status/route.ts
5. reputation + honeypot 路由、scripts/update-tor.sh
6. UI:globals.css(明暗双主题 CSS 变量)、app/[locale]/layout.tsx、page.tsx、components/{ScoreDial,DimensionBars,ProbeTable,PathPanel,EnvironmentPanel,ReputationPanel,LangSwitch,ThemeToggle}.tsx、components/detector.tsx(状态机编排)
7. README.md + 全量验收

## 验收标准(逐条机械判定)
1. `npm run build` exit 0
2. `npx vitest run` 全绿,必须覆盖:门控三分支(blocked→0 / unreachable→≤30 / geoConflict→≤45)、network 维 9 档 frac、CN 环境 tz 与 lang 计分纯函数
3. `npm start` 后 `curl -s localhost:3000/api/ip/1.1.1.1` → ok:true 且含 geo.country_code 与 risk 对象
4. 同 IP 二次请求 → meta.cached:true
5. `curl -s 'localhost:3000/api/reputation?ip=1.1.1.1'` → check_count≥1
6. `curl -s 'localhost:3000/api/honeypot?ip=1.2.3.4'` → known:false,hits:0;POST 无 HONEYPOT_KEY→503,错 key→401,配对 key→200 且随后 GET known:true
7. `curl -s localhost:3000/api/claude/status` → ok:true 且 components 为数组
8. `/zh` `/en` `/ja` 均 HTTP 200 且 h1 文案各不相同;`/` 302 到 /zh
9. `curl -s localhost:3000/api/ip/notanip` → 400
10. `npx tsc --noEmit` exit 0

## 明确禁止
- 禁止引入白名单之外依赖
- 视觉须与常见 IP 检测站明确区分(不用 Google Sans/FontAwesome/蓝绿卡片风);检测必须由用户点击触发,禁止自动开始
- 禁止将浏览器环境 7 信号、蜜罐、信誉数据发往规格列明域名之外的任何第三方
- 禁止改动规格外文件;API 路由一律 Node runtime(不用 edge)
