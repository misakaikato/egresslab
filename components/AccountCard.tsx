"use client";
// 账号体检(需用户手动授权):
// A) API Key 浏览器直连检测(不经本站服务器,不存储)
// B) 登录态采集脚本:用户在 claude.ai 控制台自运行,粘贴回结果解析
import { useState } from "react";
import { KeyRound, ClipboardPaste, ShieldCheck, Loader2 } from "lucide-react";

interface KeyResult {
  status: number;
  ok: boolean;
  models: string[];
  note: string;
  errorType?: string;
}

interface LoginScan {
  orgCount?: number;
  billing?: string;
  capabilities?: string[];
  kyc?: string;
  standing?: any;
  deviceId?: string;
  gatesTrue?: number;
  gatesTotal?: number;
  rawStatus: Record<string, number>;
}

export default function AccountCard({ t }: { t: any }) {
  const [key, setKey] = useState("");
  const [keyResult, setKeyResult] = useState<KeyResult | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [pasted, setPasted] = useState("");
  const [scan, setScan] = useState<LoginScan | null>(null);
  const [copied, setCopied] = useState(false);

  const runKeyCheck = async () => {
    setKeyBusy(true);
    setKeyResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
        headers: {
          "x-api-key": key.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      const j = await res.json().catch(() => null);
      if (res.ok) {
        const models = (j?.data || []).map((m: any) => String(m.id)).sort();
        setKeyResult({ status: res.status, ok: true, models, note: t.key.ok.replace("{n}", String(models.length)) });
      } else {
        const et = j?.error?.type || "";
        setKeyResult({
          status: res.status,
          ok: false,
          models: [],
          errorType: et,
          note: res.status === 401 ? t.key.invalid : res.status === 403 ? t.key.blocked : res.status === 429 ? t.key.ratelimit : t.key.other.replace("{s}", String(res.status)),
        });
      }
    } catch {
      setKeyResult({ status: 0, ok: false, models: [], note: t.key.network });
    } finally {
      setKeyBusy(false);
      setKey("");
    }
  };

  const snippet = `(async()=>{
  const out={};
  const g=async(u)=>{try{const r=await fetch(u,{credentials:'include'});return{s:r.status,j:await r.json().catch(()=>null)}}catch(e){return{s:0,j:null}}};
  out.orgs=await g('/api/organizations');
  const org=out.orgs.j&&(out.orgs.j.uuid||out.orgs.j.org&&out.orgs.j.org.uuid||out.orgs.j[0]&&out.orgs.j[0].uuid);
  if(org){out.access=await g('/api/bootstrap/'+org+'/current_user_access');out.kyc=await g('/api/organizations/'+org+'/kyc_status')}
  out.standing=await g('/api/account/standing');
  const m=document.cookie.match(/anthropic-device-id=([^;]+)/);
  out.deviceId=m?m[1].slice(0,12):null;
  const s=JSON.stringify(out);
  try{await navigator.clipboard.writeText(s);console.log('OK 已复制,回到 ExitLens 粘贴')}catch(e){console.log(s)}
  return s;
})()`;
  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const parsePasted = () => {
    try {
      const j = JSON.parse(pasted.trim());
      const orgs = j.orgs?.j;
      const orgObj = Array.isArray(orgs) ? orgs[0] : orgs?.org || orgs || {};
      const access = j.access?.j || {};
      const gates = access.feature_gates || access.gates || null;
      const gatesArr = gates && typeof gates === "object" ? Object.entries(gates) : [];
      setScan({
        orgCount: Array.isArray(orgs) ? orgs.length : orgObj ? 1 : 0,
        billing: orgObj?.billing_type || orgObj?.billing || undefined,
        capabilities: (orgObj?.capabilities || []).slice?.(0, 6) || [],
        kyc: j.kyc?.j?.status || j.kyc?.j?.kyc_status || (j.kyc ? "unknown" : undefined),
        standing: j.standing?.j,
        deviceId: j.deviceId || undefined,
        gatesTrue: gatesArr.length ? gatesArr.filter(([, v]) => v === true || (v as any)?.enabled === true).length : undefined,
        gatesTotal: gatesArr.length || undefined,
        rawStatus: { orgs: j.orgs?.s, access: j.access?.s, kyc: j.kyc?.s, standing: j.standing?.s },
      });
    } catch {
      setScan(null);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <KeyRound size={14} className="text-accent" />
        {t.title}
      </h3>
      <p className="text-[11px] text-muted mb-4 leading-relaxed">{t.consent}</p>

      {/* A: API Key */}
      <div className="mb-4">
        <h4 className="text-[12.5px] font-semibold mb-2">{t.key.title}</h4>
        <div className="flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-…"
            className="flex-1 min-w-0 mono text-[12px] px-3 py-1.5 rounded-lg bg-bg border border-line outline-none focus:border-accent"
            autoComplete="off"
          />
          <button onClick={runKeyCheck} disabled={!key.trim() || keyBusy} className="shrink-0 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5">
            {keyBusy ? <Loader2 size={12} className="spin" /> : <ShieldCheck size={12} />}
            {t.key.run}
          </button>
        </div>
        <p className="text-[10.5px] text-muted mt-1.5">{t.key.privacy}</p>
        {keyResult ? (
          <div className="mt-2.5 text-[12px] fade-in">
            <b style={{ color: keyResult.ok ? "var(--good)" : "var(--bad)" }}>
              HTTP {keyResult.status} · {keyResult.ok ? t.key.valid : t.key.invalidShort}
            </b>
            <span className="text-muted"> — {keyResult.note}</span>
            {keyResult.errorType ? <code className="mono text-[10.5px] text-muted ml-1">{keyResult.errorType}</code> : null}
            {keyResult.ok && keyResult.models.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {keyResult.models.slice(0, 10).map((m) => (
                  <span key={m} className="pill border-0 mono text-[10px]">{m}</span>
                ))}
                {keyResult.models.length > 10 ? <span className="text-[10px] text-muted">+{keyResult.models.length - 10}</span> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* B: 登录态采集 */}
      <div className="pt-3 border-t border-line">
        <h4 className="text-[12.5px] font-semibold mb-1.5">{t.login.title}</h4>
        <p className="text-[11px] text-muted mb-2 leading-relaxed">{t.login.steps}</p>
        <div className="flex gap-2 mb-2">
          <button onClick={copySnippet} className="pill card-hover cursor-pointer">
            <ClipboardPaste size={11} className="mr-1" />
            {copied ? t.login.copied : t.login.copy}
          </button>
        </div>
        <div className="flex gap-2">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={t.login.pasteHere}
            rows={3}
            className="flex-1 min-w-0 mono text-[11px] px-3 py-2 rounded-lg bg-bg border border-line outline-none focus:border-accent resize-y"
          />
          <button onClick={parsePasted} disabled={!pasted.trim()} className="shrink-0 self-start px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-40">
            {t.login.parse}
          </button>
        </div>
        {scan ? (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] fade-in">
            <span className="text-muted">{t.login.org}: <b className="text-ink">{scan.orgCount ?? "—"}</b>{scan.billing ? ` · ${scan.billing}` : ""}</span>
            <span className="text-muted">{t.login.kyc}: <b className="text-ink" style={{ color: scan.kyc === "not_required" ? "var(--good)" : scan.kyc === "denied" ? "var(--bad)" : undefined }}>{scan.kyc || "—"}</b></span>
            <span className="text-muted">{t.login.device}: <code className="mono text-[11px]">{scan.deviceId || "—"}</code></span>
            {scan.gatesTotal !== undefined ? <span className="text-muted">{t.login.gates}: <b className="text-ink">{scan.gatesTrue}/{scan.gatesTotal}</b></span> : null}
            {scan.standing ? <span className="text-muted col-span-2">{t.login.standing}: <code className="mono text-[10.5px]">{JSON.stringify(scan.standing).slice(0, 120)}</code></span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
