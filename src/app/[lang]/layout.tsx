import type { Metadata } from "next";
import { RootDocument } from "@/components/layout/RootDocument";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { HTML_LANG, LOCALES } from "@/i18n/config";
import { localeMetadata } from "@/i18n/metadata";
import { currentLocale, getDictionary } from "@/i18n/server";

/** Both locales are prerendered; anything else in this segment 404s at the page. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  return localeMetadata(locale, getDictionary(locale));
}

export default async function LocaleRootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await currentLocale();
  const dict = getDictionary(locale);

  return (
    <RootDocument lang={HTML_LANG[locale]}>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} dict={dict} />
      {children}
    </RootDocument>
  );
}
