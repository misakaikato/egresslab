"use client";
// 检测工具箱:收纳按需触发的工具卡(简明/专业两视图共用)
import { useState } from "react";
import { Wrench, ChevronDown } from "lucide-react";
import SpeedCard from "./SpeedCard";
import TurnstileCard from "./TurnstileCard";
import RecaptchaCard from "./RecaptchaCard";
import EchoMatrixCard from "./EchoMatrixCard";
import HeadersCard from "./HeadersCard";

export default function ToolsCard({
  t,
  turnstileKey,
  recaptchaKey,
  targetIp,
}: {
  t: any;
  toolsTitle: string;
  turnstileKey: string | null;
  recaptchaKey: string | null;
  targetIp: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden fade-in">
      <button className="w-full text-left px-5 py-4 flex items-center gap-3" onClick={() => setOpen(!open)}>
        <span className="w-8 h-8 rounded-full grid place-items-center shrink-0" style={{ background: "var(--accent-soft)" }}>
          <Wrench size={15} className="text-accent" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14.5px] font-semibold">{t.title}</span>
          <span className="block text-[12px] text-muted mt-0.5">{t.desc}</span>
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="px-5 pb-5 space-y-4 fade-in">
          <SpeedCard targetIp={targetIp} t={t.speed} />
          <TurnstileCard sitekey={turnstileKey} t={t.turnstile} />
          {recaptchaKey ? <RecaptchaCard sitekey={recaptchaKey} t={t.recaptcha} /> : null}
          <EchoMatrixCard t={t.echoMatrix} />
          <HeadersCard t={t.headers} />
        </div>
      ) : null}
    </div>
  );
}
