"use client";

import type { Locale } from "@/i18n/config";
import { isSectionKey, SECTION_KEYS, type SectionKey } from "@/i18n/sections";
import { useMotion } from "@/stores/motion-store";
import { SectionLink } from "./SectionLink";

/**
 * Main navigation of the one-page portfolio: links to its sections. The item
 * for the section currently in view (motion-store.activeSection, written by
 * each PortfolioSection's ScrollTrigger) is marked aria-current="true".
 * Re-renders only when the active section changes.
 *
 *   bar  – desktop header: small letter-spaced labels, red dot under the current one
 *   menu – mobile overlay: editorial rows (number, hairline, large label); the
 *          current one gets a red hairline and full-white label. Rows carry
 *          NavMenu's data-menu-* hooks for its reveal.
 */
export function SectionNav({
  locale,
  label,
  labels,
  variant,
  className,
}: {
  locale: Locale;
  label: string;
  labels: Record<SectionKey, string>;
  variant: "bar" | "menu";
  className?: string;
}) {
  const current = useMotion((s) => s.activeSection);
  const active: SectionKey = isSectionKey(current) ? current : "home";

  return (
    <nav aria-label={label} className={className}>
      <ul
        className={variant === "bar" ? "flex items-center gap-[clamp(1.5rem,2.85vw,3rem)]" : "grid"}
      >
        {SECTION_KEYS.map((section, index) =>
          variant === "bar" ? (
            <li key={section}>
              <SectionLink
                locale={locale}
                section={section}
                aria-current={section === active ? "true" : undefined}
                className={BAR_LINK}
              >
                {labels[section]}
              </SectionLink>
            </li>
          ) : (
            <li key={section} className="relative">
              <span
                data-menu-rule
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left bg-line"
              />
              <SectionLink
                locale={locale}
                section={section}
                aria-current={section === active ? "true" : undefined}
                className={MENU_LINK}
              >
                <span data-menu-meta aria-hidden className={MENU_META}>
                  {String(index + 1).padStart(2, "0")}
                  <span className={MENU_INDICATOR} />
                </span>
                <span className="block overflow-hidden pb-[0.06em]">
                  <span data-menu-reveal className={MENU_LABEL}>
                    {labels[section]}
                  </span>
                </span>
              </SectionLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

const BAR_LINK =
  "relative inline-flex min-h-11 items-center text-[clamp(0.6875rem,0.77vw,0.8125rem)] tracking-[0.22em] text-mist uppercase transition-colors hover:text-paper aria-[current=true]:text-paper aria-[current=true]:after:absolute aria-[current=true]:after:top-[calc(50%+0.95em)] aria-[current=true]:after:left-1/2 aria-[current=true]:after:size-1 aria-[current=true]:after:-translate-x-1/2 aria-[current=true]:after:rounded-full aria-[current=true]:after:bg-accent-bright";

const MENU_LINK =
  "group/link flex min-h-11 w-full items-center gap-[clamp(1rem,5vw,1.75rem)] py-[clamp(0.375rem,2.3svh,1.125rem)] outline-none focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-accent-bright";

/** Section number and the hairline after it (red for the current section). */
const MENU_META =
  "flex w-[3.25rem] shrink-0 items-center gap-2.5 font-[family-name:var(--font-editorial)] text-[0.6875rem] tracking-[0.18em] text-mist";

const MENU_INDICATOR =
  "h-px w-3 bg-line transition-[width,background-color] duration-300 group-hover/link:w-5 group-hover/link:bg-paper/50 group-focus-visible/link:w-5 group-aria-[current=true]/link:w-5 group-aria-[current=true]/link:bg-accent-bright";

const MENU_LABEL =
  "block text-[clamp(1.875rem,min(10.5vw,7.5svh),3.25rem)] leading-[1.08] font-light tracking-[0.05em] text-paper/55 uppercase transition-colors duration-300 group-hover/link:text-paper group-focus-visible/link:text-paper group-aria-[current=true]/link:text-paper";
