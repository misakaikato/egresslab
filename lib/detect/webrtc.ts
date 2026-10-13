// WebRTC 泄漏:多 STUN 收集 srflx 公网候选;不支持/超时返回对应状态
import type { WebRtcResult } from "../types";

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

const PUBLIC_V4 = /^\d{1,3}(\.\d{1,3}){3}$/;
function isPublicIp(ip: string): boolean {
  if (ip.includes(":")) return true; // IPv6 srflx 均为公网
  if (!PUBLIC_V4.test(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10 || a === 127 || a === 0) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 169 && b === 254) return false;
  if (a >= 224) return false;
  return true;
}

export async function detectWebRtc(timeoutMs = 8000): Promise<WebRtcResult> {
  const RTCPeerConnectionClass = (globalThis as any).RTCPeerConnection;
  if (!RTCPeerConnectionClass) return { status: "unsupported", publicIps: [] };
  return new Promise<WebRtcResult>((resolve) => {
    const ips = new Set<string>();
    let settled = false;
    const pc = new RTCPeerConnectionClass({ iceServers: STUN_SERVERS });
    const finish = (status: WebRtcResult["status"]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { pc.close(); } catch {}
      resolve({ status, publicIps: Array.from(ips) });
    };
    const timer = setTimeout(() => finish(ips.size ? "ok" : "timeout"), timeoutMs);
    pc.createDataChannel("probe");
    pc.onicecandidate = (ev: any) => {
      if (ev.candidate) {
        const m = /candidate:\S+ \d+ \S+ \d+ ([\d.]+|[0-9a-f:]+) \d+ typ srflx/i.exec(ev.candidate.candidate);
        if (m && isPublicIp(m[1])) ips.add(m[1]);
      } else if (!settled) {
        // gathering done
        finish(ips.size ? "ok" : "timeout");
      }
    };
    pc.createOffer()
      .then((offer: any) => pc.setLocalDescription(offer))
      .catch(() => finish(ips.size ? "ok" : "timeout"));
  });
}
