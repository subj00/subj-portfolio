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
 *   menu – mobile panel: large labels, red dot before the current one
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
        className={
          variant === "bar" ? "flex items-center gap-[clamp(1.5rem,2.85vw,3rem)]" : "grid gap-2"
        }
      >
        {SECTION_KEYS.map((section) => (
          <li key={section}>
            <SectionLink
              locale={locale}
              section={section}
              aria-current={section === active ? "true" : undefined}
              className={variant === "bar" ? BAR_LINK : MENU_LINK}
            >
              {variant === "menu" && (
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-accent-bright opacity-0 group-aria-[current=true]/link:opacity-100"
                />
              )}
              {labels[section]}
            </SectionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const BAR_LINK =
  "relative inline-flex min-h-11 items-center text-[clamp(0.6875rem,0.77vw,0.8125rem)] tracking-[0.22em] text-mist uppercase transition-colors hover:text-paper aria-[current=true]:text-paper aria-[current=true]:after:absolute aria-[current=true]:after:top-[calc(50%+0.95em)] aria-[current=true]:after:left-1/2 aria-[current=true]:after:size-1 aria-[current=true]:after:-translate-x-1/2 aria-[current=true]:after:rounded-full aria-[current=true]:after:bg-accent-bright";

const MENU_LINK =
  "group/link inline-flex min-h-14 items-center gap-4 text-[clamp(1.375rem,7vw,2rem)] font-light tracking-[0.18em] text-mist uppercase transition-colors hover:text-paper aria-[current=true]:text-paper";
