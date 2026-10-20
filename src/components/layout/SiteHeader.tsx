import { site } from "@/content/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { LanguageSwitcher } from "../navigation/LanguageSwitcher";
import { NavMenu } from "../navigation/NavMenu";
import { SectionNav } from "../navigation/SectionNav";
import { BrandMark } from "./BrandMark";

/** Matches the `wide` variant in globals.css: the layout without the mobile menu. */
const WIDE_QUERY = "(width >= 48rem) and (orientation: landscape)";

/**
 * Overlay header (absolute, above the hero). Its links scroll to sections of
 * the one-page portfolio.
 *   wide   – monogram | centred section nav | language + ring accent
 *   mobile – monogram | menu toggle (section nav and language inside the panel)
 */
export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 grid h-[calc(var(--header-h)+env(safe-area-inset-top))] grid-cols-[1fr_auto] items-center pt-[env(safe-area-inset-top)] pr-[var(--gutter-r)] pl-[var(--gutter-l)] wide:grid-cols-[1fr_auto_1fr]">
      <BrandMark locale={locale} label={`${site.name} — ${dict.nav.sections.home}`} />

      <SectionNav
        locale={locale}
        label={dict.nav.label}
        labels={dict.nav.sections}
        variant="bar"
        className="hidden wide:block"
      />

      <div className="hidden items-center gap-[clamp(1.25rem,2vw,2rem)] justify-self-end wide:flex">
        <LanguageSwitcher label={dict.language.label} current={locale} />
        {/* Decorative ring from the reference. Not a control (aria-hidden, no pointer events). */}
        <span
          aria-hidden
          className="pointer-events-none grid size-[clamp(2.25rem,3.1vw,2.875rem)] place-items-center rounded-full border border-line"
        >
          <span className="size-[5px] rounded-full bg-accent-bright" />
        </span>
      </div>

      <NavMenu
        openLabel={dict.nav.menuOpen}
        closeLabel={dict.nav.menuClose}
        closeWhen={WIDE_QUERY}
        className="justify-self-end wide:hidden"
        footer={<LanguageSwitcher label={dict.language.label} current={locale} variant="full" />}
      >
        <SectionNav
          locale={locale}
          label={dict.nav.label}
          labels={dict.nav.sections}
          variant="menu"
        />
      </NavMenu>
    </header>
  );
}
