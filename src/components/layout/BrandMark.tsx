import { TransitionLink } from "@/components/navigation/TransitionLink";
import type { LocalizedPath } from "@/i18n/routes";

/**
 * "JS" monogram linking home. Thin red letterforms with the S tucked against
 * the J, as in the reference. Text-based until a dedicated logo asset exists
 * (it would go in public/images/branding/ next to the name graphic).
 */
export function BrandMark({ href, label }: { href: LocalizedPath; label: string }) {
  return (
    <TransitionLink
      href={href}
      aria-label={label}
      className="relative z-10 inline-flex min-h-11 items-center justify-self-start text-[clamp(1.875rem,2.9vw,2.75rem)] leading-none font-extralight tracking-[-0.12em] text-accent transition-colors hover:text-accent-bright"
    >
      <span aria-hidden>JS</span>
    </TransitionLink>
  );
}
