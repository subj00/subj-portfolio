import type { MetadataRoute } from "next";
import { HTML_LANG, LOCALES } from "@/i18n/config";
import { alternatesFor, PAGE_KEYS } from "@/i18n/routes";
import { siteUrl } from "@/lib/site-url";

/** Every localized page, each listing its translations as hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const absolute = (path: string) => new URL(path, origin).toString();

  return PAGE_KEYS.flatMap((page) => {
    const paths = alternatesFor(page);
    const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], absolute(paths[l])]));
    return LOCALES.map((locale) => ({
      url: absolute(paths[locale]),
      alternates: { languages },
    }));
  });
}
