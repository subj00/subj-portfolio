import type { Metadata } from "next";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import { DEFAULT_LOCALE, HTML_LANG, type Locale, LOCALES, OG_LOCALE } from "./config";
import type { Dictionary } from "./dictionaries/types";
import { alternatesFor, type PageKey } from "./routes";

/** Root-layout metadata shared by every page of a locale. */
export function localeMetadata(locale: Locale, dict: Dictionary): Metadata {
  return {
    metadataBase: siteUrl(),
    title: { default: site.name, template: `%s — ${site.name}` },
    description: dict.meta.siteDescription,
    applicationName: site.name,
    openGraph: { siteName: site.name, locale: OG_LOCALE[locale], type: "website" },
  };
}

/**
 * Per-page metadata: localized title/description, canonical URL and hreflang
 * alternates (one per locale, plus x-default pointing at the default locale).
 */
export function pageMetadata(page: PageKey, locale: Locale, dict: Dictionary): Metadata {
  const { title, description } = dict.meta.pages[page];
  const paths = alternatesFor(page);
  const languages: Record<string, string> = { "x-default": paths[DEFAULT_LOCALE] };
  for (const l of LOCALES) languages[HTML_LANG[l]] = paths[l];

  return {
    // The home page shows the bare site name; inner pages use the title template.
    title: page === "home" ? { absolute: `${site.name} — ${title}` } : title,
    description,
    alternates: { canonical: paths[locale], languages },
    openGraph: {
      title: page === "home" ? site.name : title,
      description,
      url: paths[locale],
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
  };
}
