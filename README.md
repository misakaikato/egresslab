# EgressLab

Claude IP 风险自检工具:从 Claude 的视角检查你的网络出口与浏览器环境。

## 快速开始

```bash
npm install
npm run build && npm start        # 生产
npm run dev                       # 开发
```

浏览器访问 http://localhost:3000(自动跳转 /zh),点击「开始检测」。

## 功能

- **出口探测**:claude.ai / api.anthropic.com / platform.claude.com 三域名 `/cdn-cgi/trace`,读出口 IP、地区、WARP、colo
- **IP 情报聚合**(服务端,免费源):ipwho.is、ip-api.com、rdap.org、Tor 官方出口表、DNSBL(barracuda/sorbs);可选 `PROXYCHECK_API_KEY` / `ABUSEIPDB_API_KEY`(env)
- **WebRTC 泄漏**:5 公共 STUN,收集公网候选与 Claude 出口比对
- **大陆环境 7 信号**(纯本地):时区/语言/中文字体/厂商字体/国产浏览器/国产设备/Intl
- **六维评分**:网络 35 · 暴露 20 · 信誉 15 · 一致性 15 · 浏览器 10 · 自动化 5,含地区门控
- **自建历史信誉库**(SQLite):每次查询自动记录,支持人工反馈
- **蜜罐接口(预留)**:见下
- **检测历史**:本机 localStorage 记录每次检测的评分/结论/趋势,不上传
- **浏览器指纹**:Canvas/WebGL/Audio/字体/硬件九因子 + 哈希与熵估算,全本地计算
- **风控链路对照**:注册→登录→KYC→支付→运行时五阶段端点地图 + 错误码速查(社区逆向知识层,工具不调用)
- 三语 zh / en / ja,明暗双主题

## API

| 路由 | 说明 |
|---|---|
| `GET /api/ip/{ip}` | 聚合情报,缓存 1h |
| `GET /api/claude/status` | Anthropic 官方状态(5min 缓存) |
| `GET /api/reputation?ip=` | 本地信誉记录 |
| `POST /api/reputation` | `{ip, note}` 提交使用反馈 |
| `GET /api/honeypot?ip=` | 蜜罐命中查询 |
| `POST /api/honeypot` | 蜜罐上报(见下) |

### 蜜罐上报(为将来部署 Cowrie 等传感器预留)

```bash
# .env 配置 HONEYPOT_KEY=your-secret 后:
curl -X POST localhost:3000/api/honeypot \
  -H 'content-type: application/json' \
  -H "x-sensor-key: $HONEYPOT_KEY" \
  -d '{"src_ip":"1.2.3.4","sensor":"cowrie-1","proto":"ssh","detail":"brute force"}'
```

未配置 `HONEYPOT_KEY` 时上报返回 503;查询始终开放。

### 本地库(统一 GeoProvider / PrivacyProvider 接口,懒加载,缺文件自动跳过)

```bash
# 一键更新(ip2region 与 db-ip 无需任何 key;MaxMind/IPInfo/IP2Location 配 env 后自动下载)
scripts/update-local-dbs.sh
```

| 库 | 注册 | 补什么 |
|---|---|---|
| IP2Region(随 npm 包分发) | 不用 | 中国境内省市精度 |
| DB-IP city lite | 不用 | 全球城市级兜底 |
| MaxMind GeoLite2 City+ASN | 免费 key | geo/时区/ASN 本地化 |
| IPInfo privacy lite | 免费 token | 本地 VPN/代理/机房识别 |
| IP2Location DB11 LITE | 免费 token | CSV→SQLite 区间查询 |

新增同类库:实现 `lib/server/intel/local.ts` 的 `GeoProvider` 或补充 `lookupLocalPrivacy` 并注册进 `GEO_PROVIDERS` 即可。

### 自建数据积累

```bash
# Tor 出口表每小时更新(建议 crontab)
scripts/update-tor.sh
# 本地库每周更新
scripts/update-local-dbs.sh
```

信誉库 `data/egresslab.db` 随使用自动积累;换机迁移拷贝该文件即可。

## 数据流向

浏览器环境特征**不上传**。情报查询访问:ipwho.is、ip-api.com、rdap.org、check.torproject.org、DNSBL、status.anthropic.com(及可选 proxycheck/AbuseIPDB)。Trace 探测直连 anthropic 三域名。

## 测试

```bash
npx vitest run        # 评分门控 / 九档网络分 / 环境信号纯函数
npx tsc --noEmit
```

## 参考与致谢

本项目的检测思路与数据能力站在以下项目和服务的肩膀上。

### 数据源

| 提供方 | 用途 |
|---|---|
| [ipwho.is](https://ipwho.is) / [ip-api.com](https://ip-api.com) | IP 地理与网络信息 |
| [RIPEstat](https://stat.ripe.net) | 注册国(RIPE Whois)与 BGP 前缀首次宣告时间 |
| [rdap.org](https://rdap.org) | RDAP 注册数据 |
| [Tor Project](https://check.torproject.org/torbulkexitlist) | 官方 Tor 出口列表 |
| [Barracuda](https://www.barracudacentral.org) / [SORBS](http://www.sorbs.net) | DNSBL 黑名单查询 |
| [FireHOL](https://github.com/firehol/blocklist-ipsets) | 聚合封锁列表(level1) |
| [StopForumSpam](https://www.stopforumspam.com) | 垃圾注册 IP 记录 |
| [abuse.ch ThreatFox](https://threatfox.abuse.ch) | 恶意 IoC 检索(端点变更中,静默降级) |
| [DB-IP](https://db-ip.com) | City Lite 本地库(CC BY 4.0) |
| [ip2region](https://github.com/lionsoul2014/ip2region)(MIT) | 中国境内定位精度 |
| [Cloudflare](https://www.cloudflare.com/ips) | 官方 IP 段与 `cdn-cgi/trace` 边缘回显 |
| Google / Cloudflare / Twilio STUN | WebRTC 泄漏检测 |
| [proxycheck.io](https://proxycheck.io) / [AbuseIPDB](https://www.abuseipdb.com) / [MaxMind GeoLite2](https://www.maxmind.com) / [IPInfo](https://ipinfo.io) / [IP2Location](https://www.ip2location.com) | 可选增强源(env key) |

### 开源库

- [Next.js](https://nextjs.org) / [React](https://react.dev) — 框架
- [Tailwind CSS](https://tailwindcss.com) — 样式
- [lucide-react](https://lucide.dev) — 图标
- [maxmind](https://github.com/runk/maxmind)(ISC) — mmdb 读取

### 设计参考

同类工具的公开实现与文档为本文档化过的检测项提供了大量灵感:

- [MyIP](https://github.com/jason5ng32/MyIP) — IP 工具箱的功能布局,连通包 / 多源出口对照 / curl API / 报告导出
- [dnsleaktest](https://github.com/macvk/dnsleaktest) — DNS 泄漏检测方法论
- [claude-environment-check](https://github.com/TZZ520/claude-environment-check) — Claude 环境自检的检查项组织
- [EgressScope](https://github.com/uruana33/egress-scope) — 出口诊断工作台的分区思路
- [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright) — 自动化浏览器检测面的理解
- [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) / [CreepJS](https://github.com/AbrahamJuliot/creepjs) — 浏览器环境信号(字体/时区/矛盾检测)
