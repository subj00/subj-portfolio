import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { pageMetadata } from "@/i18n/metadata";
import { getDictionary, requireLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requireLocale();
  return pageMetadata("home", locale, getDictionary(locale));
}

export default async function Page() {
  const locale = await requireLocale();
  return <HomePage locale={locale} dict={getDictionary(locale)} />;
}
