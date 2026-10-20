"use client";

import { type ReactNode, useRef } from "react";
import { useSectionActivation } from "@/animation/use-section-activation";
import type { SectionKey } from "@/i18n/sections";

/**
 * One section of the continuous portfolio page. Registers itself with the
 * existing section-activation tracking (motion-store.activeSection = its key),
 * which drives the nav's current item and, later, scroll-linked transitions.
 * Focusable (tabIndex -1) so in-page navigation can move focus into it.
 */
export function PortfolioSection({
  section,
  id,
  labelledBy,
  className,
  children,
}: {
  section: SectionKey;
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useSectionActivation(ref, section);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      data-section={section}
      className={`outline-none ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
