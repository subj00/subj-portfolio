import { PortfolioSection } from "@/components/layout/PortfolioSection";
import type { Locale } from "@/i18n/config";
import { type SectionKey, sectionId } from "@/i18n/sections";

/**
 * TEMPORARY stand-in for a portfolio section (About, Projects, Contact) until
 * its design is implemented. One viewport tall so anchors, scrolling and
 * section tracking behave as they will with real content. Deliberately plain.
 */
export function SectionPlaceholder({
  locale,
  section,
  title,
  body,
}: {
  locale: Locale;
  section: Exclude<SectionKey, "home">;
  title: string;
  body: string;
}) {
  const headingId = `${section}-title`;
  return (
    <PortfolioSection
      section={section}
      id={sectionId(locale, section)}
      labelledBy={headingId}
      className="flex min-h-svh flex-col justify-center border-t border-line pr-[var(--gutter-r)] pl-[var(--gutter-l)]"
    >
      <h2
        id={headingId}
        className="text-[clamp(1.5rem,4vw,3rem)] font-light tracking-[0.08em] uppercase"
      >
        {title}
      </h2>
      <p className="mt-4 text-soft">{body}</p>
    </PortfolioSection>
  );
}
