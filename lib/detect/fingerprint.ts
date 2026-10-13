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
  // 7. 计时精度被压低 → 反指纹措施(非伪装,但值得标注)
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
