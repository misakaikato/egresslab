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
