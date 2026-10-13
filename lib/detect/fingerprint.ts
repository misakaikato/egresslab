// 浏览器指纹:Canvas/WebGL/Audio/字体/硬件,全部本地计算,哈希不上传
export interface FingerprintComponent {
  key: string;
  value: string;
  bits: number; // 该因子估算熵
}

export interface FingerprintResult {
  hash: string; // sha256 前 32 位
  components: FingerprintComponent[];
  entropyBits: number;
  fontCount: number;
  unavailable: string[];
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

function webglFingerprint(): { renderer: string; vendor: string; params: string } {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { renderer: "unavailable", vendor: "unavailable", params: "unavailable" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "") : String(gl.getParameter(gl.RENDERER) || "");
    const vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || "") : String(gl.getParameter(gl.VENDOR) || "");
    const params = [
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      gl.getParameter(gl.MAX_VARYING_VECTORS),
      gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    ].join("/");
    return { renderer, vendor, params };
  } catch {
    return { renderer: "unavailable", vendor: "unavailable", params: "unavailable" };
  }
}

async function sha256Hex(input: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // 降级:FNV-1a
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0").repeat(4);
  }
}

export async function collectFingerprint(): Promise<FingerprintResult> {
  const components: FingerprintComponent[] = [];
  const unavailable: string[] = [];
  const ctx = document.createElement("canvas").getContext("2d");
  // Canvas
  const canvas = canvasFingerprint();
  if (canvas === "unavailable") unavailable.push("canvas");
  components.push({ key: "canvas", value: canvas === "unavailable" ? "—" : "stable render", bits: canvas === "unavailable" ? 0 : 8 });
  // WebGL
  const gl = webglFingerprint();
  if (gl.renderer === "unavailable") unavailable.push("webgl");
  else components.push({ key: "webgl", value: `${gl.renderer} · ${gl.params}`, bits: 8 });
  // Audio
  const audio = await audioFingerprint();
  if (audio === "unavailable") unavailable.push("audio");
  else components.push({ key: "audio", value: audio, bits: 6 });
  // Fonts
  let fontCount = 0;
  if (ctx) fontCount = EXT_FONTS.filter((f) => fontExists(f, ctx)).length;
  else unavailable.push("fonts");
  if (ctx) components.push({ key: "fonts", value: `${fontCount}/${EXT_FONTS.length}`, bits: 6 });
  // Screen
  components.push({
    key: "screen",
    value: `${screen.width}x${screen.height}@${window.devicePixelRatio}x ${screen.colorDepth}bit`,
    bits: 5,
  });
  // Hardware
  const nav: any = navigator;
  components.push({
    key: "hardware",
    value: `${nav.hardwareConcurrency || "?"} cores · ${nav.deviceMemory || nav.deviceMemory === 0 ? nav.deviceMemory : "?"}GB · ${nav.maxTouchPoints ?? 0} touch`,
    bits: 4,
  });
  // Timezone / language / platform
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
  components.push({ key: "timezone", value: tz || "unknown", bits: 4 });
  components.push({ key: "language", value: navigator.language || "", bits: 3 });
  const plat = nav.userAgentData?.platform || nav.platform || "";
  components.push({ key: "platform", value: plat || "unknown", bits: 3 });
  // 合成哈希(全部因子拼接)
  const input = components.map((c) => `${c.key}=${c.value}`).join("|");
  const hash = (await sha256Hex(input)).slice(0, 32);
  const entropyBits = components.reduce((s, c) => s + c.bits, 0);
  return { hash, components, entropyBits, fontCount, unavailable };
}
