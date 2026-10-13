import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { LOCALES } from "@/lib/i18n/config";
import { dict } from "@/lib/i18n/config";
import { LangSwitch, ThemeToggle, GithubLink } from "../../components/Chrome";
import Logo from "../../components/Logo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = dict(locale);
  return { title: t.meta.title, description: t.meta.desc, robots: { index: false, follow: false } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as any)) notFound();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem("exitlens:theme")||localStorage.getItem("egresslab:theme")||"system";var d=p==="dark"||p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 backdrop-blur border-b border-line" style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
          <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <a href={`/${locale}`} className="text-ink flex items-center gap-1.5 -translate-y-px hover:opacity-80">
                <Logo size={20} />
                <span className="font-display text-lg font-bold tracking-tight">ExitLens</span>
              </a>
              <a href={`/${locale}/card`} className="text-xs text-muted hover:text-accent hidden sm:inline">{dict(locale).cardPage.title}</a>
              <a href={`/${locale}/scoring`} className="text-xs text-muted hover:text-accent hidden sm:inline">{dict(locale).scoringPage.title}</a>
              <span className="text-xs text-muted hidden sm:inline">{dict(locale).nav.tag}</span>
            </div>
            <div className="flex items-center gap-2">
              <GithubLink />
              <LangSwitch locale={locale} />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="max-w-5xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{dict(locale).footer.privacy}</span>
            <span>{dict(locale).footer.selfhost}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
