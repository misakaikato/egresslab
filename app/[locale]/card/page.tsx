import { notFound } from "next/navigation";
import { LOCALES, dict } from "@/lib/i18n/config";
import CardPage from "@/components/CardPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as any)) notFound();
  return <CardPage t={dict(locale).cardPage} />;
}
