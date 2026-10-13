// Cloudflare Turnstile 信任检测(env TURNSTILE_SITEKEY,未配置自动隐藏)
// 静默通过=指纹与 IP 得到 CF 信任;需要交互=边缘存疑
export interface TurnstileResult {
  passed: boolean;
  silent: boolean; // true=无任何指针事件即拿到 token
  ms: number;
  error?: string;
}

interface WidgetHandle {
  remove: () => void;
}

function loadTurnstile(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((globalThis as any).turnstile) return resolve((globalThis as any).turnstile);
    const sc = document.createElement("script");
    sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    sc.async = true;
    sc.onload = () => resolve((globalThis as any).turnstile);
    sc.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(sc);
  });
}

export async function runTurnstile(container: HTMLElement, sitekey: string, timeoutMs = 30000): Promise<TurnstileResult> {
  const t0 = performance.now();
  let interacted = false;
  const mark = () => {
    interacted = true;
  };
  window.addEventListener("pointerdown", mark, { once: true, capture: true });
  try {
    const ts = await loadTurnstile();
    const res = await new Promise<TurnstileResult>((resolve) => {
      let done = false;
      const finish = (r: TurnstileResult) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(r);
      };
      const timer = setTimeout(() => finish({ passed: false, silent: false, ms: Math.round(performance.now() - t0), error: "timeout" }), timeoutMs);
      let handle: WidgetHandle | null = null;
      handle = ts.render(container, {
        sitekey,
        callback: () => finish({ passed: true, silent: !interacted, ms: Math.round(performance.now() - t0) }),
        "error-callback": (code: string) => finish({ passed: false, silent: false, ms: Math.round(performance.now() - t0), error: String(code) }),
        "expired-callback": () => finish({ passed: false, silent: false, ms: Math.round(performance.now() - t0), error: "expired" }),
        "response-callback": () => {},
      });
      void handle;
    });
    return res;
  } catch (e: any) {
    return { passed: false, silent: false, ms: Math.round(performance.now() - t0), error: e?.message || "load failed" };
  }
}
