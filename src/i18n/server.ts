import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { sr } from "./dictionaries/sr";
import type { Dictionary } from "./dictionaries/types";

/**
 * Server-only i18n access (next/root-params cannot be imported by client code,
 * so the build enforces this). Dictionaries never reach the client bundle: client
 * components receive the strings they render as props.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { sr, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Locale of the current route, or DEFAULT_LOCALE for an unknown segment (which 404s). */
export async function currentLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * For pages: the route's locale, or a 404 when the segment is not a locale or
 * the page does not exist in it (e.g. /en/o-meni). Pass the locale a localized
 * slug folder belongs to.
 */
export async function requireLocale(only?: Locale): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value) || (only && value !== only)) notFound();
  return value;
}
