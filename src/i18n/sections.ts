import type { Locale } from "./config";
import { ROUTES } from "./routes";

/**
 * The portfolio is one continuous page per locale; these are its sections, in
 * scroll order. Anchors are localized and ASCII-only (readable, no %-encoding).
 * Section keys are locale-independent, so active-section state and the language
 * switcher can map /sr#o-meni ⇄ /en#about.
 */
export const SECTION_KEYS = ["home", "about", "projects", "contact"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_IDS = {
  sr: { home: "pocetna", about: "o-meni", projects: "projekti", contact: "kontakt" },
  en: { home: "home", about: "about", projects: "projects", contact: "contact" },
} as const satisfies Record<Locale, Record<SectionKey, string>>;

export type SectionId = (typeof SECTION_IDS)[Locale][SectionKey];

export function sectionId(locale: Locale, section: SectionKey): SectionId {
  return SECTION_IDS[locale][section];
}

/** e.g. "/sr#o-meni": a real URL, so links work without JavaScript and in new tabs. */
export type SectionHref = `${(typeof ROUTES)["home"][Locale]}#${SectionId}`;

export function sectionHref(locale: Locale, section: SectionKey): SectionHref {
  return `${ROUTES.home[locale]}#${SECTION_IDS[locale][section]}`;
}

/** Section key for an anchor id in a locale, or null. */
export function sectionFromId(locale: Locale, id: string): SectionKey | null {
  for (const key of SECTION_KEYS) if (SECTION_IDS[locale][key] === id) return key;
  return null;
}

export function isSectionKey(value: string | null | undefined): value is SectionKey {
  return (SECTION_KEYS as readonly (string | null | undefined)[]).includes(value);
}
