import { site } from "@/content/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { LanguageSwitcher } from "../navigation/LanguageSwitcher";
import { NavMenu } from "../navigation/NavMenu";
import { SectionNav } from "../navigation/SectionNav";
import { BrandMark } from "./BrandMark";
import { StickyHeader } from "./StickyHeader";

/** Matches the `wide` variant in globals.css: the layout without the mobile menu. */
const WIDE_QUERY = "(width >= 48rem) and (orientation: landscape)";

/**
 * Fixed header, visible over every section of the one-page portfolio; its links
 * scroll to those sections. Transparent over the top of the hero; once scrolled
 * it gains a translucent dark backdrop with a hairline and becomes slightly
 * more compact (StickyHeader sets data-scrolled). z-40, above the content and
 * the WebGL canvas (which sits behind all content).
 *   wide   – monogram | centred section nav | language + ring accent
 *   mobile – monogram | menu toggle (section nav and language inside the panel)
 */
export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <StickyHeader className={HEADER}>
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
        footer={
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="text-[0.6875rem] tracking-[0.32em] text-mist uppercase">
              {dict.home.role}
            </p>
            <LanguageSwitcher label={dict.language.label} current={locale} variant="full" />
          </div>
        }
      >
        <SectionNav
          locale={locale}
          label={dict.nav.label}
          labels={dict.nav.sections}
          variant="menu"
        />
      </NavMenu>
    </StickyHeader>
  );
}

/*
 * Height eases to 84% when scrolled (fixed, so nothing below moves). The
 * backdrop is a ::before layer whose opacity transitions: no blur, no shadow.
 */
const HEADER = [
  "fixed inset-x-0 top-0 z-40 grid grid-cols-[1fr_auto] items-center wide:grid-cols-[1fr_auto_1fr]",
  "h-[calc(var(--header-h)+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] pr-[var(--gutter-r)] pl-[var(--gutter-l)]",
  "transition-[height] duration-500 ease-out data-scrolled:h-[calc(var(--header-h)*0.84+env(safe-area-inset-top))]",
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:border-b before:border-line before:bg-[linear-gradient(rgb(5_5_5/0.86),rgb(5_5_5/0.7))] before:opacity-0 before:transition-opacity before:duration-500 data-scrolled:before:opacity-100",
  "motion-reduce:transition-none motion-reduce:before:transition-none data-settling:transition-none data-settling:before:transition-none",
].join(" ");
