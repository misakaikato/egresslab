// 常见端口轻量探测:家宽/纯净落地 IP 开放 SSH/3389 等端口会被深度识别为服务器行为
// ⚠ 默认关闭:本机代理(Clash/SOCKS 透明拦截)会让所有端口都"连得上",全是假阳性。
// 只有部署在"直连无代理"的服务器上结果才有意义,此时用 PORTSCAN=1 显式开启。
export const SCAN_PORTS = [22, 80, 443, 445, 3389, 8080] as const;

export function portScanEnabled(): boolean {
  return process.env.PORTSCAN === "1";
}

async function probePort(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  try {
    const net = await import("node:net");
    return await new Promise<boolean>((resolve) => {
      const sock = net.connect({ host: ip, port, timeout: timeoutMs });
      const done = (ok: boolean) => {
        sock.destroy();
        resolve(ok);
      };
      sock.once("connect", () => done(true));
      sock.once("timeout", () => done(false));
      sock.once("error", () => done(false));
    });
  } catch {
    return false;
  }
}

export async function scanPorts(ip: string, timeoutMs = 1500): Promise<number[] | null> {
  if (!portScanEnabled() || ip.includes(":")) return null;
  const results = await Promise.all(SCAN_PORTS.map(async (p): Promise<number | null> => ((await probePort(ip, p, timeoutMs)) ? p : null)));
  return results.filter((p): p is number => p !== null);
}
