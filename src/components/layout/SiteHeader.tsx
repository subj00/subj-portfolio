import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { localizedPath, PAGE_KEYS } from "@/i18n/routes";
import { LanguageSwitcher } from "../navigation/LanguageSwitcher";
import { PrimaryNav } from "../navigation/PrimaryNav";

/** Structural header (navigation + language). Visual design comes in a later step. */
export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = PAGE_KEYS.map((page) => ({
    href: localizedPath(page, locale),
    label: dict.nav.pages[page],
  }));

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-2">
      <PrimaryNav label={dict.nav.label} items={items} />
      <LanguageSwitcher label={dict.language.label} current={locale} />
    </header>
  );
}
