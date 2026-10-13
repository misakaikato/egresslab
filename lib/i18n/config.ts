export const LOCALES = ["zh", "en", "ja"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "zh";

import zh from "./zh";
import en from "./en";
import ja from "./ja";

export const DICTS: Record<AppLocale, typeof zh> = { zh, en, ja };

export function dict(locale: string): typeof zh {
  return DICTS[(LOCALES as readonly string[]).includes(locale) ? (locale as AppLocale) : DEFAULT_LOCALE];
}
