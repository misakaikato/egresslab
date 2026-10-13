"use client";
// 导航组件:语言切换 + 主题切换
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Globe, Moon, Sun, Github, Star } from "lucide-react";

export function GithubLink() {
  return (
    <a
      href="https://github.com/misakaikato/exitlens"
      target="_blank"
      rel="noopener"
      title="GitHub · 如果有用请点个 Star"
      className="flex items-center gap-1 px-2.5 h-8 rounded-full border border-line text-xs text-soft hover:text-accent hover:border-accent transition-colors"
    >
      <Github size={13} />
      <span>Star</span>
      <Star size={11} className="text-accent" />
    </a>
  );
}

export function LangSwitch({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;
  return (
    <div className="flex items-center rounded-full border border-line overflow-hidden text-xs">
      {["zh", "en", "ja"].map((l) => (
        <button
          key={l}
          onClick={() => router.push(pathname.replace(new RegExp(`^/${locale}`), `/${l}`))}
          className={`px-2 py-1 uppercase tracking-wide transition-colors ${l === locale ? "bg-accent text-white" : "text-muted hover:text-ink"}`}
          aria-label={l}
        >
          {l === "zh" ? "中" : l}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("exitlens:theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={toggle} className="w-8 h-8 grid place-items-center rounded-full border border-line text-soft hover:text-accent" aria-label="theme">
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

export function LangIcon() {
  return <Globe size={14} />;
}
