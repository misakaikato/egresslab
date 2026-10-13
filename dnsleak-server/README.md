# ExitLens DNS Leak Observer

真 DNS 泄漏检测的权威观察服务:UDP 53 应答 + 查询日志 API。

## 前提

- 一台可开放 UDP 53 的主机(CF Workers / Vercel **不行**:无 UDP)
- Cloudflare 上为 `leak.exitlens.misakamikoto.top` 添加 NS 记录指向本机(仅 DNS,不开代理)

## 部署

```bash
# 方式一:裸机 / VM(注意 systemd-resolved 会占 53,先禁用或改用 5353+iptables 转发)
sudo mkdir -p /opt/exitlens-dnsleak && sudo cp -r . /opt/exitlens-dnsleak/
cd /opt/exitlens-dnsleak && npm install --omit=dev
sudo cp exitlens-dnsleak.service /etc/systemd/system/
sudo systemctl enable --now exitlens-dnsleak

# 方式二:Docker
docker build -t exitlens-dnsleak . && docker run -d --name dnsleak \
  -p 53:53/udp -p 8090:8090 -v /srv/dnsleak:/data \
  -e DNSLEAK_ZONE=leak.exitlens.misakamikoto.top exitlens-dnsleak
```

## 验证

```bash
curl http://127.0.0.1:8090/healthz
dig +short ${TOKEN}-1.leak.exitlens.misakamikoto.top @<本机IP>   # 应回 203.0.113.66
```

## Cloudflare 面板

`misakamikoto.top` → DNS → 添加记录:

| 类型 | 名称 | 内容 |
|---|---|---|
| NS | leak.exitlens | <本机域名或 IP 对应的 NS 主机名> |

注意:CF 的 NS 记录要求目标是**主机名**;若本机只有 IP,可顺手加一条 `ns1-leak.misakamikoto.top A <IP>`,NS 指向它。NS 记录必须是灰色云(DNS only)。

## 接入 ExitLens

在网站侧(Vercel)配置环境变量:

```
DNSLEAK_ZONE=leak.exitlens.misakamikoto.top
DNSLEAK_API=http://<本机IP>:8090
```

检测页的「真 DNS 出口」随即启用;未配置时该模块自动隐藏。
