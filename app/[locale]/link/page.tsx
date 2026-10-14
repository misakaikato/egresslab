import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, dict } from "@/lib/i18n/config";
import ConnectivityBoard from "@/components/ConnectivityBoard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${dict(locale).conn.title} · ExitLens`, robots: { index: false } };
}

export default async function LinkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as any)) notFound();
  const t = dict(locale);
  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl font-bold mb-1">{t.conn.title}</h1>
      <p className="text-sm text-muted mb-6 max-w-2xl leading-relaxed">{t.conn.desc}</p>
      <ConnectivityBoard t={t.conn} />
    </div>
  );
}
