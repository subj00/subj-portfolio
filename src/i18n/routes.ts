import type { Route } from "next";
import { type Locale, LOCALES } from "./config";

/**
 * The single source of truth for localized URLs. Every link, the language
 * switcher, hreflang alternates and the sitemap derive from this table, so a
 * slug is changed in exactly one place (plus its route folder).
 */
export const PAGE_KEYS = ["home", "about", "projects"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const ROUTES = {
  home: { sr: "/sr", en: "/en" },
  about: { sr: "/sr/o-meni", en: "/en/about" },
  projects: { sr: "/sr/projekti", en: "/en/projects" },
} as const satisfies Record<PageKey, Record<Locale, Route>>;

export function localizedPath(page: PageKey, locale: Locale): Route {
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
export function alternatesFor(page: PageKey): Record<Locale, Route> {
  return ROUTES[page];
}
