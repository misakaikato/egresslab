"use client";
// 签名卡生成器:主题选择 + 实时预览 + 嵌入代码
import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

const THEMES: { key: string; swatch: string[] }[] = [
  { key: "paper", swatch: ["#f6f4f0", "#bc5527"] },
  { key: "graphite", swatch: ["#2b2e33", "#8ab4f8"] },
  { key: "ink", swatch: ["#14120f", "#d97757"] },
  { key: "matrix", swatch: ["#0a0f0a", "#39ff14"] },
  { key: "sakura", swatch: ["#fdf2f4", "#e87ea1"] },
  { key: "ocean", swatch: ["#0d1b2a", "#48cae4"] },
  { key: "sunset", swatch: ["#2b1204", "#ff9e4f"] },
  { key: "cyber", swatch: ["#0f0a1e", "#b14aed"] },
];

const SIZES = [240, 360, 480, 560, 720];

export default function CardPage({ t }: { t: any }) {
  const [style, setStyle] = useState("paper");
  const [size, setSize] = useState(480);
  const [ipMode, setIpMode] = useState<"visitor" | "specified">("visitor");
  const [ip, setIp] = useState("");
  const [copied, setCopied] = useState(0);
  const [bump, setBump] = useState(0);

  const url = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://exitlens.misakamikoto.top";
    const q = new URLSearchParams({ style, v: String(bump) });
    if (ipMode === "specified" && ip.trim()) q.set("ip", ip.trim());
    return `${base}/api/card?${q.toString()}`;
  }, [style, ipMode, ip, bump]);
  const site = typeof window !== "undefined" ? window.location.origin : "https://exitlens.misakamikoto.top";
  const snippets = [
    { name: "Markdown", code: `[![ExitLens](${url})](${site})` },
    { name: "HTML", code: `<a href="${site}"><img src="${url}" alt="ExitLens" width="${size}"></a>` },
    { name: "BBCode", code: `[url=${site}][img]${url}[/img][/url]` },
    { name: "URL", code: url },
  ];

  const copy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(0), 1500);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">{t.title}</h1>
      <p className="text-sm text-muted mb-8 leading-relaxed">{t.desc}</p>

      <div className="card p-6 mb-6 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={url} src={url} alt="ExitLens card" width={size} style={{ height: "auto", maxWidth: "100%", borderRadius: 12 }} />
        <button onClick={() => setBump(Date.now())} className="pill card-hover cursor-pointer mt-4">{t.refresh}</button>
      </div>

      <div className="card p-5 mb-4">
        <h3 className="text-[13px] font-semibold mb-3">{t.theme}</h3>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((th) => (
            <button key={th.key} onClick={() => setStyle(th.key)} className={`press rounded-lg border px-2.5 py-1.5 flex items-center gap-1.5 ${style === th.key ? "border-accent" : "border-line"}`}>
              <span className="w-3.5 h-3.5 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${th.swatch[0]} 55%, ${th.swatch[1]} 55%)` }} />
              <span className="text-[11.5px]">{th.key}</span>
            </button>
          ))}
        </div>
        <h3 className="text-[13px] font-semibold mt-4 mb-3">{t.size}</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setSize(s)} className={`press pill ${size === s ? "border-accent text-accent" : ""}`}>{s}</button>
          ))}
        </div>
        <h3 className="text-[13px] font-semibold mt-4 mb-3">{t.ipMode.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIpMode("visitor")} className={`press pill ${ipMode === "visitor" ? "border-accent text-accent" : ""}`}>{t.ipMode.visitor}</button>
          <button onClick={() => setIpMode("specified")} className={`press pill ${ipMode === "specified" ? "border-accent text-accent" : ""}`}>{t.ipMode.specified}</button>
          {ipMode === "specified" ? (
            <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="1.2.3.4" className="mono text-[12px] px-3 py-1.5 rounded-lg bg-bg border border-line outline-none focus:border-accent w-40" />
          ) : null}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-[13px] font-semibold mb-3">{t.embed}</h3>
        <div className="space-y-2">
          {snippets.map((sn, i) => (
            <div key={sn.name} className="flex items-center gap-2 bg-bg border border-line rounded-lg px-3 py-2">
              <span className="text-[10.5px] font-semibold text-muted w-16 shrink-0">{sn.name}</span>
              <code className="mono text-[10.5px] flex-1 truncate text-soft">{sn.code}</code>
              <button onClick={() => copy(sn.code, i + 1)} className="text-muted hover:text-accent shrink-0" aria-label="copy">
                {copied === i + 1 ? <Check size={13} style={{ color: "var(--good)" }} /> : <Copy size={13} />}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10.5px] text-muted mt-3 leading-relaxed">{t.crawlerNote}</p>
      </div>
    </div>
  );
}
