import { SectionLink } from "@/components/navigation/SectionLink";
import type { Locale } from "@/i18n/config";

/**
 * "JS" monogram linking to the top of the portfolio (the hero section). Thin red
 * letterforms with the S tucked against the J, as in the reference. Text-based
 * until a dedicated logo asset exists (it would go in public/images/branding/).
 */
export function BrandMark({ locale, label }: { locale: Locale; label: string }) {
  return (
    <SectionLink
      locale={locale}
      section="home"
      aria-label={label}
      className="relative z-10 inline-flex min-h-11 items-center justify-self-start text-[clamp(1.875rem,2.9vw,2.75rem)] leading-none font-extralight tracking-[-0.12em] text-accent transition-colors outline-none hover:text-accent-bright focus-visible:text-accent-bright focus-visible:underline focus-visible:decoration-1 focus-visible:underline-offset-[0.18em]"
    >
      <span aria-hidden>JS</span>
    </SectionLink>
  );
}
