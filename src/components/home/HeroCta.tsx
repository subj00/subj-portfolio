import { TransitionLink } from "@/components/navigation/TransitionLink";
import type { LocalizedPath } from "@/i18n/routes";

/**
 * Circular-accent call to action: a thin red ring with a dot, followed by a
 * letter-spaced label. The whole row is one link (keyboard and touch target),
 * with a hover/focus state on the ring only.
 */
export function HeroCta({
  href,
  label,
  className,
}: {
  href: LocalizedPath;
  label: string;
  className?: string;
}) {
  return (
    <TransitionLink
      href={href}
      className={`group inline-flex items-center gap-[clamp(1rem,1.5vw,1.5rem)] ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="grid size-[clamp(3rem,3.75vw,3.75rem)] place-items-center rounded-full border border-accent/70 transition-colors duration-300 group-hover:border-accent-bright group-focus-visible:border-accent-bright"
      >
        <span className="size-[5px] rounded-full bg-accent-bright transition-transform duration-300 group-hover:scale-150 motion-reduce:transition-none" />
      </span>
      <span className="text-[clamp(0.625rem,0.75vw,0.8125rem)] tracking-[0.4em] text-paper uppercase">
        {label}
      </span>
    </TransitionLink>
  );
}
