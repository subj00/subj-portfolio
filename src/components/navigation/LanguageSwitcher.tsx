"use client";

import { usePathname } from "next/navigation";
import { HTML_LANG, type Locale, LOCALE_NAMES, LOCALES } from "@/i18n/config";
import { localizedPath, matchRoute } from "@/i18n/routes";
import { TransitionLink } from "./TransitionLink";

/**
 * Links to the current page in every language (e.g. /sr/o-meni ⇄ /en/about).
 * Each option is labelled in its own language with matching lang/hreflang, so
 * screen readers pronounce it correctly.
 *
 * Switching language changes the root layout's [lang] segment, which remounts
 * the app shell (including the WebGL stage) for the new locale.
 */
export function LanguageSwitcher({ label, current }: { label: string; current: Locale }) {
  const page = matchRoute(usePathname())?.page ?? "home";

  return (
    <nav aria-label={label}>
      <ul className="flex gap-3">
        {LOCALES.map((locale) => (
          <li key={locale}>
            <TransitionLink
              href={localizedPath(page, locale)}
              lang={HTML_LANG[locale]}
              hrefLang={HTML_LANG[locale]}
              aria-current={locale === current ? "true" : undefined}
              className="inline-flex min-h-11 items-center underline-offset-4 aria-[current=true]:underline"
            >
              {LOCALE_NAMES[locale]}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
