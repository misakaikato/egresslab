import { notFound } from "next/navigation";
import { LOCALES } from "@/lib/i18n/config";
import Detector from "@/components/detector";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as any)) notFound();
  return <Detector locale={locale} />;
}
