// 浏览器指纹(全量):Canvas/WebGL(+2)/WebGPU/Audio/字体(存在+宽度)/解码器矩阵/
// 语音列表/UA-CH/Emoji/键盘布局/显示器/Intl/窗口几何/存储/媒体设备/网络/计时精度
// 全部本地计算,哈希不上传;另含伪装矛盾检测(lies)
export interface FingerprintComponent {
  key: string;
  value: string;
  bits: number;
}

export interface FingerprintLie {
  key: string;
  detail: string;
}

export interface FingerprintResult {
  hash: string;
  components: FingerprintComponent[];
  entropyBits: number;
  fontCount: number;
  unavailable: string[];
  lies: FingerprintLie[];
}

const EXT_FONTS = ["Arial", "Arial Black", "Arial Narrow", "Avenir", "Avenir Next", "Baskerville", "Bodoni 72", "Bookman Old Style", "Calibri", "Cambria", "Candara", "Cochin", "Comic Sans MS", "Consolas", "Constantia", "Copperplate", "Courier New", "Didot", "Futura", "Geneva", "Georgia", "Gill Sans", "Helvetica", "Helvetica Neue", "Hoefler Text", "Impact", "Lucida Grande", "Lucida Sans Unicode", "Marker Felt", "Menlo", "Monaco", "Optima", "Palatino", "Papyrus", "Perpetua", "Rockwell", "SF Pro Text", "Segoe UI", "Skia", "Snell Roundhand", "Tahoma", "Times New Roman", "Trattatello", "Trebuchet MS", "Verdana", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "SimSun"];

function fontExists(font: string, ctx: CanvasRenderingContext2D): boolean {
  const sample = "Befgy 012\u4e2d";
  for (const base of ["monospace", "sans-serif", "serif"]) {
    ctx.font = `72px ${base}`;
    const w0 = ctx.measureText(sample).width;
    ctx.font = `72px "${font}", ${base}`;
    if (Math.abs(ctx.measureText(sample).width - w0) > 0.5) return true;
  }
  return false;
}

function fontWidth(font: string, ctx: CanvasRenderingContext2D): number {
  ctx.font = `32px "${font}", sans-serif`;
  return ctx.measureText("Wg.\u4e2d 018\xb0").width;
}

function canvasFingerprint(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 280;
    c.height = 60;
    const ctx = c.getContext("2d");
    if (!ctx) return "unavailable";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 110, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("EgressLab \u6307\u7eb9 fp 42\xb0C \u4e2d\u6587", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("EgressLab \u6307\u7eb9 fp 42\xb0C \u4e2d\u6587", 4, 18);
    ctx.strokeStyle = "#c4552d";
    ctx.beginPath();
    ctx.bezierCurveTo(10, 55, 120, 10, 260, 40);
    ctx.stroke();
    return c.toDataURL().slice(-180);
  } catch {
    return "unavailable";
  }
}

// Emoji 渲染:平台 emoji 字体差异 + 旗帜(Windows 不渲染旗帜)
function emojiFingerprint(): { fp: string; flagsRender: boolean | null } {
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 44;
    const ctx = c.getContext("2d");
    if (!ctx) return { fp: "unavailable", flagsRender: null };
    ctx.font = "32px sans-serif";
    ctx.fillText("\u{1F600}\u{1F44D}\u2764\u{1F3AF}\u{1F916}", 2, 34);
    const plain = c.toDataURL().length;
    ctx.clearRect(0, 0, 200, 44);
    ctx.font = "32px sans-serif";
    ctx.fillText("\u{1F1FA}\u{1F1F3}\u{1F1E8}\u{1F1F3}", 2, 34); // 旗帜 UN CN
    const flags = c.toDataURL().length;
    // 旗帜渲染时 dataURL 明显更长(彩色字形);返回长度差作判据
    const flagsRender = flags > plain * 1.02 ? true : Math.abs(flags - plain) < 30 ? false : null;
    return { fp: `${plain}:${flags}`, flagsRender };
  } catch {
    return { fp: "unavailable", flagsRender: null };
  }
}

async function audioFingerprint(): Promise<string> {
  try {
    const AC = (globalThis as any).OfflineAudioContext;
    if (!AC) return "unavailable";
    const ctx = new AC(1, 5000, 44100);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50;
    comp.knee.value = 40;
    comp.ratio.value = 12;
    comp.attack.value = 0;
    comp.release.value = 0.25;
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    const buf = await ctx.startRendering();
    const data = buf.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
    return sum.toFixed(8);
  } catch {
    return "unavailable";
  }
}

// 真实 AudioContext 细节(采样率/通道/延迟)
function audioDetails(): string {
  try {
    const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
    if (!AC) return "unavailable";
    const ctx = new AC();
    const details = `${ctx.sampleRate}/${ctx.destination.maxChannelCount}/${typeof ctx.baseLatency === "number" ? ctx.baseLatency.toFixed(6) : "?"}`;
    ctx.close?.().catch(() => {});
    return details;
  } catch {
    return "unavailable";
  }
}

const CODEC_PROBES: [string, string][] = [
  ['video/mp4; codecs="avc1.42E01E"', "H.264"],
  ['video/mp4; codecs="hvc1.1.6.L93.B0"', "HEVC"],
  ['video/mp4; codecs="av01.0.05M.08"', "AV1"],
  ["video/webm; codecs=vp8", "VP8"],
  ["video/webm; codecs=vp9", "VP9"],
  ['video/ogg; codecs="theora"', "Theora"],
  ['audio/mp4; codecs="mp4a.40.2"', "AAC"],
  ["audio/mpeg", "MP3"],
  ['audio/ogg; codecs=opus', "Opus"],
  ['audio/ogg; codecs="vorbis"', "Vorbis"],
  ["audio/wav", "WAV"],
  ["audio/flac", "FLAC"],
];

function codecFingerprint(): string {
  try {
    const v = document.createElement("video");
    const a = document.createElement("audio");
    return CODEC_PROBES.map(([t]) => {
      const el = t.startsWith("video") ? v : a;
      const r = el.canPlayType(t);
      return r === "probably" ? "2" : r === "maybe" ? "1" : "0";
    }).join("");
  } catch {
    return "unavailable";
  }
}

function codecSupportedCount(fp: string): number {
  return fp.split("").filter((c) => c !== "0").length;
}

// 已安装语音(异步加载,等待 voiceschanged)
async function voicesFingerprint(): Promise<{ fp: string; count: number; sample: string }> {
  try {
    const ss = (globalThis as any).speechSynthesis;
    if (!ss) return { fp: "unavailable", count: 0, sample: "—" };
    let voices: any[] = ss.getVoices() || [];
    if (!voices.length) {
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, 500);
        ss.onvoiceschanged = () => {
          clearTimeout(t);
          resolve();
        };
      });
      voices = ss.getVoices() || [];
    }
    const names = voices.map((v) => `${v.name}|${v.lang}`).sort();
    return { fp: names.join(";"), count: names.length, sample: names.slice(0, 2).map((n) => n.split("|")[0]).join(", ") };
  } catch {
    return { fp: "unavailable", count: 0, sample: "—" };
  }
}

// UA-CH 高熵
async function uaChFingerprint(): Promise<{ fp: string; display: string; platform: string; arch: string }> {
  try {
    const uad: any = (navigator as any).userAgentData;
    if (!uad?.getHighEntropyValues) return { fp: "unavailable", display: "—", platform: "", arch: "" };
    const hi = await uad.getHighEntropyValues(["architecture", "bitness", "platformVersion", "uaFullVersion", "model"]);
    return {
      fp: `${hi.architecture}/${hi.bitness}/${hi.platformVersion}/${hi.uaFullVersion}/${hi.model || ""}`,
      display: `${hi.architecture || "?"} ${hi.bitness || "?"}bit v${(hi.platformVersion || "?").split(".")[0]}${hi.model ? ` · ${hi.model}` : ""}`,
      platform: String(hi.platform || ""),
      arch: String(hi.architecture || ""),
    };
  } catch {
    return { fp: "unavailable", display: "—", platform: "", arch: "" };
  }
}

function webglInfo(which: 1 | 2): { renderer: string; vendor: string; params: string; exts: string } {
  try {
    const c = document.createElement("canvas");
    const gl = (which === 2 ? c.getContext("webgl2") : c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { renderer: "unavailable", vendor: "unavailable", params: "unavailable", exts: "unavailable" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "") : String(gl.getParameter(gl.RENDERER) || "");
    const vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || "") : String(gl.getParameter(gl.VENDOR) || "");
    const params = [gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_VERTEX_ATTRIBS), gl.getParameter(gl.MAX_VARYING_VECTORS), gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)].join("/");
    const exts = (gl.getSupportedExtensions() || []).join(",").length + "#" + (gl.getSupportedExtensions() || []).length;
    return { renderer, vendor, params, exts };
  } catch {
    return { renderer: "unavailable", vendor: "unavailable", params: "unavailable", exts: "unavailable" };
  }
}

// WebGPU 适配器(新 API,Chrome)
async function webgpuFingerprint(): Promise<{ fp: string; display: string }> {
  try {
    const gpu: any = (navigator as any).gpu;
    if (!gpu) return { fp: "unavailable", display: "—" };
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { fp: "no-adapter", display: "—" };
    const info = adapter.info || (adapter.requestAdapterInfo ? await adapter.requestAdapterInfo() : {});
    const s = `${info.vendor || ""}/${info.architecture || ""}/${info.device || ""}/${info.description || ""}`;
    return { fp: s, display: s === "///" ? "masked" : `${info.vendor || "?"} ${info.architecture || ""}`.trim() };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

// 键盘布局
async function keyboardFingerprint(): Promise<{ fp: string; display: string }> {
  try {
    const kb: any = (navigator as any).keyboard;
    if (!kb?.getLayoutMap) return { fp: "unavailable", display: "—" };
    const map = await kb.getLayoutMap();
    const keys = ["KeyQ", "KeyW", "KeyZ", "KeyY", "KeyP", "Semicolon"];
    const vals = keys.map((k) => String(map.get(k) || "?"));
    const qwerty = vals[0] === "q" && vals[2] === "z" && vals[3] === "y";
    const qwertz = vals[0] === "q" && vals[2] === "y" && vals[3] === "z";
    const azerty = vals[0] === "a";
    return { fp: vals.join(""), display: qwerty ? "QWERTY" : qwertz ? "QWERTZ" : azerty ? "AZERTY" : vals.join("") };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

// 显示器能力与用户偏好
function displayCapabilities(): string {
  try {
    const mq = (q: string) => (matchMedia(q).matches ? "1" : "0");
    return [
      mq("(color-gamut: srgb)"),
      mq("(color-gamut: p3)"),
      mq("(color-gamut: rec2020)"),
      mq("(dynamic-range: high)"),
      mq("(prefers-reduced-motion: reduce)"),
      mq("(prefers-color-scheme: dark)"),
      mq("(forced-colors: active)"),
      mq("(pointer: coarse)"),
      mq("(hover: hover)"),
    ].join("");
  } catch {
    return "unavailable";
  }
}

// Intl 深化:历法/数系/Collator 排序/区域链
function intlDeep(): { fp: string; display: string } {
  try {
    const dtf = Intl.DateTimeFormat().resolvedOptions();
    const sample = ["b", "a", "\u00e4", "z", "\u4e2d", "\u00fc"].sort(new Intl.Collator().compare);
    const localeChain = (navigator.languages || [navigator.language]).join(",");
    return {
      fp: `${dtf.calendar}/${dtf.numberingSystem}/${sample.join("")}/${localeChain}`,
      display: `${dtf.locale} ${dtf.calendar}/${dtf.numberingSystem}`,
    };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

async function storageEstimate(): Promise<{ fp: string; display: string }> {
  try {
    const est: any = await navigator.storage?.estimate?.();
    if (!est || typeof est.quota !== "number") return { fp: "unavailable", display: "—" };
    const gb = est.quota / 1073741824;
    return { fp: String(est.quota), display: `${gb.toFixed(1)} GB` };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

async function mediaDeviceCounts(): Promise<{ fp: string; display: string }> {
  try {
    const devices: MediaDeviceInfo[] = await (navigator as any).mediaDevices?.enumerateDevices?.();
    if (!devices) return { fp: "unavailable", display: "—" };
    const c = (k: string) => devices.filter((d) => d.kind === k).length;
    return { fp: devices.map((d) => d.kind).sort().join(","), display: `\u{1F3A4}${c("audioinput")} \u{1F4F7}${c("videoinput")}` };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

function connectionInfo(): { fp: string; display: string } {
  const c: any = (navigator as any).connection;
  if (!c) return { fp: "unavailable", display: "—" };
  return { fp: `${c.effectiveType}/${c.rtt}/${c.downlink}/${c.saveData}`, display: c.effectiveType ? `${c.effectiveType} ${c.downlink || "?"}Mb` : "—" };
}

// 计时精度:分辨率被压低 = 反指纹措施线索
function timingPrecision(): { fp: string; display: string; reduced: boolean } {
  try {
    let min = Infinity;
    for (let i = 0; i < 200; i++) {
      const a = performance.now();
      let b = performance.now();
      while (b === a) b = performance.now();
      min = Math.min(min, b - a);
    }
    const reduced = min >= 0.1;
    return { fp: min.toFixed(6), display: `${(min * 1000).toFixed(min * 1000 < 10 ? 1 : 0)}\u00b5s${reduced ? " \u2693" : ""}`, reduced };
  } catch {
    return { fp: "unavailable", display: "—", reduced: false };
  }
}

async function sha256Hex(input: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0").repeat(4);
  }
}

function osFromUa(ua: string): string {
  const t = ua.toLowerCase();
  if (/iphone|ipad/.test(t)) return "ios";
  if (/android/.test(t)) return "android";
  if (/mac os|macintosh/.test(t)) return "mac";
  if (/windows/.test(t)) return "windows";
  if (/linux|cros/.test(t)) return "linux";
  return "other";
}

function tzOffsetMinutesNow(tz: string): number | null {
  try {
    const now = new Date();
    const asLocal = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    return Math.round((asLocal.getTime() - now.getTime()) / 60000);
  } catch {
    return null;
  }
}

export async function collectFingerprint(): Promise<FingerprintResult> {
  const components: FingerprintComponent[] = [];
  const unavailable: string[] = [];
  const push = (key: string, value: string, bits: number) => {
    if (value === "unavailable") unavailable.push(key);
    else components.push({ key, value, bits });
  };
  const ctx = document.createElement("canvas").getContext("2d");
  const nav: any = navigator;

  // 基础
  const canvas = canvasFingerprint();
  push("canvas", canvas, 8);
  const gl1 = webglInfo(1);
  const gl2 = webglInfo(2);
  push("webgl", gl1.renderer === "unavailable" ? "unavailable" : `${gl1.renderer}|${gl1.params}`, 8);
  push("webgl2", gl2.renderer === "unavailable" ? "unavailable" : `${gl2.renderer}|${gl2.exts}`, 6);
  const audio = await audioFingerprint();
  push("audio", audio, 6);
  const audioDet = audioDetails();
  push("audioDetail", audioDet, 3);
  let fontCount = 0;
  if (ctx) {
    fontCount = EXT_FONTS.filter((f) => fontExists(f, ctx)).length;
    components.push({ key: "fonts", value: `${fontCount}/${EXT_FONTS.length}`, bits: 6 });
    const widths = ["Segoe UI", "Helvetica Neue", "Menlo", "Consolas", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Georgia", "Avenir", "Optima"].map((f) => fontWidth(f, ctx).toFixed(2)).join(",");
    components.push({ key: "fontWidths", value: widths, bits: 4 });
  } else unavailable.push("fonts", "fontWidths");
  components.push({ key: "screen", value: `${screen.width}x${screen.height}@${window.devicePixelRatio}x ${screen.colorDepth}bit`, bits: 5 });
  components.push({ key: "geometry", value: `avail ${screen.availWidth}x${screen.availHeight} | win ${window.outerWidth}x${window.outerHeight} | ui ${window.outerHeight - window.innerHeight}`, bits: 3 });
  components.push({ key: "hardware", value: `${nav.hardwareConcurrency || "?"}c ${nav.deviceMemory != null ? nav.deviceMemory + "GB" : "?"} ${nav.maxTouchPoints ?? 0}t`, bits: 4 });
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
  push("timezone", tz || "unavailable", 4);
  push("language", navigator.language || "unavailable", 3);
  const uaChPlatform = nav.userAgentData?.platform || "";
  push("platform", uaChPlatform || nav.platform || "unavailable", 3);

  // 第一/二梯队扩展
  const codecs = codecFingerprint();
  push("codecs", codecs === "unavailable" ? "unavailable" : codecs, 10);
  const voices = await voicesFingerprint();
  push("voices", voices.fp, voices.fp === "unavailable" || voices.count === 0 ? 0 : 8);
  const uach = await uaChFingerprint();
  push("uach", uach.fp, uach.fp === "unavailable" ? 0 : 8);
  const emoji = emojiFingerprint();
  push("emoji", emoji.fp, 5);
  const kb = await keyboardFingerprint();
  push("keyboard", kb.fp, kb.fp === "unavailable" ? 0 : 5);
  push("display", displayCapabilities(), 4);
  const intl = intlDeep();
  push("intl", intl.fp, 4);
  const webgpu = await webgpuFingerprint();
  push("webgpu", webgpu.fp, webgpu.fp === "unavailable" || webgpu.fp === "no-adapter" ? 0 : 6);
  const storage = await storageEstimate();
  push("storage", storage.fp, storage.fp === "unavailable" ? 0 : 3);
  const mdev = await mediaDeviceCounts();
  push("mediaDevices", mdev.fp, mdev.fp === "unavailable" ? 0 : 3);
  const conn = connectionInfo();
  push("connection", conn.fp, conn.fp === "unavailable" ? 0 : 2);
  const timing = timingPrecision();
  push("timing", timing.fp, 1);

  // 第三批
  const apis = apiSurface();
  push("apiSurface", apis.fp, 8);
  const perms = await permissionStates();
  push("permissions", perms.fp, perms.fp === "unavailable" ? 0 : 6);
  const rr = await refreshRate();
  push("refresh", rr.fp, rr.fp === "unavailable" ? 0 : 3);
  const topo = displayTopology();
  push("topology", topo.fp, 2);
  const tm = textMetricsFp(ctx);
  push("textMetrics", tm.fp, 4);
  push("scrollbar", scrollbarWidth(), 2);
  const me = mathEngine();
  push("math", me.fp, 3);
  const wc = await webcodecsProbe();
  push("webcodecs", wc.fp, 4);
  push("wasm", `${wasmSimd()}/${typeof SharedArrayBuffer !== "undefined"}`, 3);
  const sdp = await sdpFingerprint();
  push("sdp", sdp.fp, 4);
  const sv = await serverView();
  if (sv.skewMs !== null) components.push({ key: "clockSkew", value: `${sv.skewMs > 0 ? "+" : ""}${sv.skewMs}ms`, bits: 5 });
  if (sv.headerOrder) components.push({ key: "headerOrder", value: sv.headerOrder, bits: 6 });
  const quotaNum = Number(storage.fp);
  if (Number.isFinite(quotaNum) && quotaNum > 0) components.push({ key: "incognito", value: quotaNum < 300_000_000 ? "reduced" : "normal", bits: 1 });
  push("privacySet", `${(navigator as any).doNotTrack || "-"}/${(navigator as any).globalPrivacyControl ?? "-"}`, 1);
  // 信标同款补充因子
  push("charset", document.characterSet || "unavailable", 1);
  let caps = "unavailable";
  try {
    caps = `${(window as any).localStorage ? 1 : 0}${(window as any).sessionStorage ? 1 : 0}${(window as any).indexedDB ? 1 : 0}${navigator.cookieEnabled ? 1 : 0}`;
  } catch {}
  push("storageCaps", caps, 1);
  push("plugins", String(navigator.plugins?.length ?? -1), 1);

  const input = components.map((c) => `${c.key}=${c.value}`).join("|");
  const hash = (await sha256Hex(input)).slice(0, 32);
  const entropyBits = components.reduce((s, c) => s + c.bits, 0);

  // ── 伪装矛盾检测(lies)──
  const lies: FingerprintLie[] = [];
  const os = osFromUa(nav.userAgent);
  // 1. UA 平台 vs 签名字体
  if (ctx) {
    const macFont = ["PingFang SC", "Menlo", "Optima"].some((f) => fontExists(f, ctx));
    const winFont = ["Segoe UI", "Consolas"].some((f) => fontExists(f, ctx));
    if (os === "windows" && macFont && !winFont) lies.push({ key: "platformFonts", detail: "UA: Windows but macOS-only fonts present" });
    if ((os === "mac" || os === "ios") && winFont && !macFont) lies.push({ key: "platformFonts", detail: "UA: macOS but Windows-only fonts present" });
  }
  // 2. 旗帜 emoji vs 平台(Windows 不渲染旗帜)
  if (emoji.flagsRender === true && os === "windows") lies.push({ key: "emojiPlatform", detail: "UA: Windows but flag emoji render (not native)" });
  // 3. WebGL1 vs WebGL2 renderer
  if (gl1.renderer !== "unavailable" && gl2.renderer !== "unavailable" && gl1.renderer && gl2.renderer && gl1.renderer !== gl2.renderer) {
    lies.push({ key: "webglMismatch", detail: `WebGL1 "${gl1.renderer}" != WebGL2 "${gl2.renderer}"` });
  }
  // 4. UA-CH platform vs navigator.platform
  if (uaChPlatform && nav.platform && uaChPlatform.toLowerCase() !== nav.platform.toLowerCase()) {
    lies.push({ key: "platformClaim", detail: `UA-CH "${uaChPlatform}" != navigator.platform "${nav.platform}"` });
  }
  // 5. Intl 时区 vs 系统偏移
  if (tz) {
    const expect = tzOffsetMinutesNow(tz);
    const actual = -new Date().getTimezoneOffset();
    if (expect !== null && Math.abs(expect - actual) > 0) lies.push({ key: "tzSpoof", detail: `Intl TZ ${tz} offset ${expect}m != system ${actual}m` });
  }
  // 6. navigator.language vs Intl locale
  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const navLang = (navigator.language || "").toLowerCase();
    if (navLang && intlLocale && !intlLocale.toLowerCase().startsWith(navLang.split("-")[0])) {
      lies.push({ key: "langSpoof", detail: `navigator.language "${navigator.language}" != Intl locale "${intlLocale}"` });
    }
  } catch {}
  // 7.5 字体双通道不一致
  const fcCount = fontsCheckChannel();
  if (fcCount >= 0 && fontCount > 0 && Math.abs(fcCount - fontCount) >= 3) {
    lies.push({ key: "fontsChannel", detail: `canvas ${fontCount} vs fonts.check ${fcCount}` });
  }
  // 7.6 时钟偏移异常(>1h)
  if (sv.skewMs !== null && Math.abs(sv.skewMs) > 3600_000) {
    lies.push({ key: "clockSkew", detail: `clock off by ${Math.round(sv.skewMs / 60000)} min` });
  }
  // 8. 计时精度被压低 → 反指纹措施(非伪装,但值得标注)
  if (timing.reduced) lies.push({ key: "timingReduced", detail: `performance.now() resolution reduced (${timing.display})` });

  return {
    hash,
    components,
    entropyBits,
    fontCount,
    unavailable,
    lies,
  };
}

// ---- 第三批因子 ----

// API 存在性矩阵(引擎/版本指纹 + bot 检测面)
function apiSurface(): { fp: string; display: string } {
  const probes: [string, boolean][] = [
    ["usb", !!nav_any().usb],
    ["bt", !!(navigator as any).bluetooth],
    ["serial", !!(navigator as any).serial],
    ["hid", !!(navigator as any).hid],
    ["nfc", typeof (globalThis as any).NDEFReader !== "undefined"],
    ["xr", !!(navigator as any).xr],
    ["ink", !!(navigator as any).ink],
    ["pressure", typeof (globalThis as any).PressureObserver !== "undefined"],
    ["share", !!(navigator as any).share],
    ["wake", !!(navigator as any).wakeLock],
    ["idle", typeof (globalThis as any).IdleDetector !== "undefined"],
    ["present", !!(navigator as any).presentation],
    ["screens", typeof (globalThis as any).getScreenDetails === "function"],
    ["launch", !!(navigator as any).launchQueue],
    ["vkb", !!(navigator as any).virtualKeyboard],
    ["posture", !!(navigator as any).devicePosture],
    ["gpu", !!(navigator as any).gpu],
    ["coded", typeof (globalThis as any).VideoEncoder !== "undefined"],
  ];
  const fp = probes.map(([, ok]) => (ok ? "1" : "0")).join("");
  return { fp, display: `${probes.filter(([, ok]) => ok).length}/${probes.length}` };
}
function nav_any(): any {
  return navigator as any;
}

// 权限状态矩阵(用户行为特征)
async function permissionStates(): Promise<{ fp: string; display: string }> {
  const names = ["geolocation", "notifications", "camera", "microphone", "clipboard-read", "midi", "persistent-storage", "accelerometer"];
  const results = await Promise.all(
    names.map(async (n) => {
      try {
        const st = await (navigator as any).permissions.query({ name: n });
        return st.state === "granted" ? "g" : st.state === "denied" ? "d" : "p";
      } catch {
        return "x";
      }
    })
  );
  return { fp: results.join(""), display: results.filter((r) => r !== "p" && r !== "x").length + " 异常态" };
}

// 刷新率(rAF 实测)
async function refreshRate(): Promise<{ fp: string; display: string }> {
  return new Promise((resolve) => {
    try {
      let last = performance.now();
      const deltas: number[] = [];
      const tick = (t: number) => {
        if (deltas.length && t - last > 0) deltas.push(t - last);
        last = t;
        if (deltas.length < 24) requestAnimationFrame(tick);
        else {
          deltas.sort((a, b) => a - b);
          const med = deltas[Math.floor(deltas.length / 2)];
          const hz = Math.round(1000 / med);
          resolve({ fp: String(hz), display: `${hz}Hz` });
        }
      };
      requestAnimationFrame(tick);
      setTimeout(() => resolve({ fp: "unavailable", display: "—" }), 2500);
    } catch {
      resolve({ fp: "unavailable", display: "—" });
    }
  });
}

// 显示器拓扑
function displayTopology(): { fp: string; display: string } {
  const ext = (screen as any).isExtended;
  const ori = (screen as any).orientation;
  return { fp: `${ext ? 1 : 0}/${ori?.type || "?"}/${ori?.angle ?? "?"}`, display: `${ext ? "多屏" : "单屏"} ${ori?.type?.split("-")[0] || ""}` };
}

// TextMetrics 完整字段
function textMetricsFp(ctx: CanvasRenderingContext2D | null): { fp: string; display: string } {
  try {
    if (!ctx) return { fp: "unavailable", display: "—" };
    ctx.font = '32px "Arial", sans-serif';
    const m = ctx.measureText("Hxg\u4e2d 018\xb0");
    const f = (v: unknown) => (typeof v === "number" ? v.toFixed(3) : "?");
    const fp = `${f(m.width)}|${f((m as any).actualBoundingBoxAscent)}|${f((m as any).actualBoundingBoxDescent)}|${f((m as any).actualBoundingBoxLeft)}|${f((m as any).actualBoundingBoxRight)}|${f((m as any).fontBoundingBoxAscent)}|${f((m as any).fontBoundingBoxDescent)}`;
    return { fp, display: `${f((m as any).actualBoundingBoxAscent)}/${f((m as any).fontBoundingBoxAscent)}` };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

// 滚动条宽度(DPI/缩放/平台)
function scrollbarWidth(): string {
  try {
    const outer = document.createElement("div");
    outer.style.cssText = "width:100px;height:100px;overflow:scroll;position:absolute;visibility:hidden";
    document.body.appendChild(outer);
    const w = outer.offsetWidth - outer.clientWidth;
    outer.remove();
    return String(w);
  } catch {
    return "unavailable";
  }
}

// Math 引擎指纹
function mathEngine(): { fp: string; display: string } {
  try {
    const vals = [Math.tan(-1e300), Math.sin(1e300), Math.acos(0.123), Math.atanh(0.5), Math.expm1(1), Math.sinh(1)];
    return { fp: vals.join(","), display: vals[0].toFixed(12) };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

// WebCodecs 硬件编码(GPU 硬解能力)
async function webcodecsProbe(): Promise<{ fp: string; display: string }> {
  try {
    const VE: any = (globalThis as any).VideoEncoder;
    if (!VE?.isConfigSupported) return { fp: "unavailable", display: "—" };
    const cfgs: [string, any][] = [
      ["hevc", { codec: "hev1.1.6.L93.B0", width: 640, height: 360, bitrate: 1_000_000, framerate: 30 }],
      ["av1", { codec: "av01.0.04M.08", width: 640, height: 360, bitrate: 1_000_000, framerate: 30 }],
      ["h264", { codec: "avc1.42001E", width: 640, height: 360, bitrate: 1_000_000, framerate: 30 }],
    ];
    const out: string[] = [];
    for (const [name, cfg] of cfgs) {
      try {
        const r = await VE.isConfigSupported(cfg);
        out.push(`${name}:${r.supported ? 1 : 0}`);
      } catch {
        out.push(`${name}:x`);
      }
    }
    return { fp: out.join("/"), display: out.map((o) => o.replace(":1", "\u2713").replace(":0", "\u2717").replace(":x", "?")).join(" ") };
  } catch {
    return { fp: "unavailable", display: "—" };
  }
}

// WASM SIMD(CPU 指令集)
function wasmSimd(): boolean {
  try {
    const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
    return WebAssembly.validate(bytes);
  } catch {
    return false;
  }
}

// SDP 结构(m-line/codec 顺序,DTLS 指纹等随机字段剔除)
async function sdpFingerprint(): Promise<{ fp: string; display: string }> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("x");
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try {
          pc.close();
        } catch {}
        const sdp = pc.localDescription?.sdp || "";
        if (!sdp) return resolve({ fp: "unavailable", display: "—" });
        const stable = sdp
          .split("\n")
          .filter((l) => l.startsWith("m=") || l.startsWith("a=rtpmap") || l.startsWith("a=extmap") || l.startsWith("a=fmtp"))
          .map((l) => l.replace(/[\s]+$/, ""))
          .join(";")
          .replace(/urn:3gpp:video/i, "");
        const codecs = (sdp.match(/a=rtpmap:\d+ (\w+)/g) || []).map((m) => m.split(" ")[1]).slice(0, 6).join(",");
        resolve({ fp: stable.slice(0, 400), display: codecs || "—" });
      };
      const timer = setTimeout(finish, 3000);
      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .catch(() => finish());
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") finish();
      };
    } catch {
      resolve({ fp: "unavailable", display: "—" });
    }
  });
}

// fonts.check 第二通道(绕过部分 canvas 拦截)
function fontsCheckChannel(): number {
  try {
    if (!document.fonts?.check) return -1;
    return EXT_FONTS.filter((f) => document.fonts.check(`12px "${f}"`)).length;
  } catch {
    return -1;
  }
}

// 服务器视角:时钟偏移 + 头序 + 客户端提示头
async function serverView(): Promise<{ skewMs: number | null; headerOrder: string; hints: string }> {
  try {
    const t0 = Date.now();
    const res = await fetch("/api/me", { cache: "no-store" });
    const t1 = Date.now();
    const j = await res.json();
    const serverMono = typeof j.mono === "number" ? j.mono : null;
    const skew = serverMono !== null ? Math.round(serverMono - (t0 + t1) / 2) : null;
    return {
      skewMs: skew,
      headerOrder: (j.headerOrder || []).join(","),
      hints: ["sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform"].map((k) => j.headers?.[k] || "-").join("|"),
    };
  } catch {
    return { skewMs: null, headerOrder: "", hints: "" };
  }
}

// claude.ai 前端 s-cdn 信标的公开观测采集面:命中即标记"Claude 也采集"
export const CLAUDE_COLLECTS: Set<string> = new Set([
  "canvas", "webgl", "fonts", "fontWidths", "screen", "hardware", "timezone",
  "language", "platform", "audio", "codecs", "uach", "emoji", "display",
  "incognito", "charset", "storageCaps", "plugins",
]);
