import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { pageMetadata } from "@/i18n/metadata";
import { getDictionary, requireLocale } from "@/i18n/server";

// Localized slug: this route exists only in "en" (other locales 404).
const LOCALE = "en";

export function generateStaticParams() {
  return [{ lang: LOCALE }];
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requireLocale(LOCALE);
  return pageMetadata("about", locale, getDictionary(locale));
}

export default async function Page() {
  const dict = getDictionary(await requireLocale(LOCALE));
  return <PlaceholderPage title={dict.meta.pages.about.title} body={dict.placeholder.inProgress} />;
}
