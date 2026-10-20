"use client";

import { HTML_LANG, type Locale, LOCALE_NAMES, LOCALE_SHORT, LOCALES } from "@/i18n/config";
import { localizedPath } from "@/i18n/routes";
import { isSectionKey, sectionHref } from "@/i18n/sections";
import { useMotion } from "@/stores/motion-store";
import { TransitionLink } from "./TransitionLink";

/**
 * Links to the same place in every language: the one-page portfolio at the
 * section currently in view (/sr#o-meni ⇄ /en#about), or the top of the page.
 * Each option's accessible name is its endonym in its own language (lang and
 * hreflang set), so screen readers pronounce it correctly.
 *
 *   compact – "SR  EN" for the desktop header
 *   full    – "Srpski  English" for the mobile menu
 *
 * Switching language changes the root layout's [lang] segment, which remounts
 * the app shell for the new locale.
 */
export function LanguageSwitcher({
  label,
  current,
  variant = "compact",
  className,
}: {
  label: string;
  current: Locale;
  variant?: "compact" | "full";
  className?: string;
}) {
  const active = useMotion((s) => s.activeSection);
  const hrefFor = (locale: Locale) =>
    isSectionKey(active) && active !== "home"
      ? sectionHref(locale, active)
      : localizedPath("home", locale);

  return (
    <nav aria-label={label} className={className}>
      <ul className={variant === "compact" ? "flex items-center gap-4" : "flex items-center gap-8"}>
        {LOCALES.map((locale) => (
          <li key={locale}>
            <TransitionLink
              href={hrefFor(locale)}
              lang={HTML_LANG[locale]}
              hrefLang={HTML_LANG[locale]}
              aria-label={variant === "compact" ? LOCALE_NAMES[locale] : undefined}
              aria-current={locale === current ? "true" : undefined}
              className={`inline-flex min-h-11 min-w-6 items-center justify-center tracking-[0.22em] text-mist uppercase transition-colors hover:text-paper aria-[current=true]:text-paper ${
                variant === "compact" ? "text-[clamp(0.6875rem,0.77vw,0.8125rem)]" : "text-xs"
              }`}
            >
              {variant === "compact" ? LOCALE_SHORT[locale] : LOCALE_NAMES[locale]}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
