"use client";

import { usePathname } from "next/navigation";
import type { LocalizedPath } from "@/i18n/routes";
import { TransitionLink } from "./TransitionLink";

export interface PrimaryNavItem {
  href: LocalizedPath;
  label: string;
}

/**
 * Desktop main navigation: small, letter-spaced uppercase links; the current
 * page is white with a red dot beneath. Labels come from the server dictionary.
 */
export function PrimaryNav({
  label,
  items,
  className,
}: {
  label: string;
  items: PrimaryNavItem[];
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center gap-[clamp(1.5rem,2.85vw,3rem)]">
        {items.map((item) => (
          <li key={item.href}>
            <TransitionLink
              href={item.href}
              aria-current={item.href === pathname ? "page" : undefined}
              className="relative inline-flex min-h-11 items-center text-[clamp(0.6875rem,0.77vw,0.8125rem)] tracking-[0.22em] text-mist uppercase transition-colors hover:text-paper aria-[current=page]:text-paper aria-[current=page]:after:absolute aria-[current=page]:after:top-[calc(50%+0.95em)] aria-[current=page]:after:left-1/2 aria-[current=page]:after:size-1 aria-[current=page]:after:-translate-x-1/2 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-accent-bright"
            >
              {item.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
