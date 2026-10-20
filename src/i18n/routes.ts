import type { Route } from "next";
import { type Locale, LOCALES } from "./config";

/**
 * The single source of truth for localized URLs: links, the language switcher,
 * hreflang alternates and the sitemap derive from this table.
 *
 * The portfolio is ONE continuous page per locale; About, Projects and Contact
 * are sections of it (see sections.ts), not routes. Future routes (e.g. project
 * detail pages) are added here with their localized slugs.
 */
export const PAGE_KEYS = ["home"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

/**
 * Typed-routes check for one literal path: `route("/sr")` compiles only
 * if a matching route folder exists (dynamic segments need the literal inferred).
 */
const route = <T extends string>(path: Route<T>) => path;

export const ROUTES = {
  home: { sr: route("/sr"), en: route("/en") },
} as const satisfies Record<PageKey, Record<Locale, string>>;

export type LocalizedPath = (typeof ROUTES)[PageKey][Locale];

export function localizedPath(page: PageKey, locale: Locale): LocalizedPath {
  return ROUTES[page][locale];
}

/** Which page and locale a pathname belongs to; null for non-localized routes (e.g. /lab). */
export function matchRoute(pathname: string): { page: PageKey; locale: Locale } | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const page of PAGE_KEYS) {
    for (const locale of LOCALES) {
      if (ROUTES[page][locale] === normalized) return { page, locale };
    }
  }
  return null;
}

/** Same page in every locale, e.g. for hreflang alternates. */
export function alternatesFor(page: PageKey): Record<Locale, LocalizedPath> {
  return ROUTES[page];
}
