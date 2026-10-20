/**
 * Locale configuration. Pure data: safe to import from server and client code.
 * Adding a locale = add it here, add a dictionary, add its route slugs.
 */
export const LOCALES = ["sr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sr";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tags for <html lang> and hreflang. Serbian content is Latin script. */
export const HTML_LANG: Record<Locale, string> = {
  sr: "sr-Latn",
  en: "en",
};

/** Open Graph locale codes. */
export const OG_LOCALE: Record<Locale, string> = {
  sr: "sr_RS",
  en: "en_US",
};

/** Each language's name in that language (endonym), shown in the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  sr: "Srpski",
  en: "English",
};

/** Compact labels for the desktop switcher (the endonym stays the accessible name). */
export const LOCALE_SHORT: Record<Locale, string> = {
  sr: "SR",
  en: "EN",
};
