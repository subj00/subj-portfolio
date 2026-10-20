"use client";

import type { Route } from "next";
import { usePathname } from "next/navigation";
import { TransitionLink } from "./TransitionLink";

export interface PrimaryNavItem {
  href: Route;
  label: string;
}

/** Localized main navigation. Labels come from the server dictionary as props. */
export function PrimaryNav({ label, items }: { label: string; items: PrimaryNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-4">
        {items.map((item) => (
          <li key={item.href}>
            <TransitionLink
              href={item.href}
              aria-current={item.href === pathname ? "page" : undefined}
              className="inline-flex min-h-11 items-center underline-offset-4 aria-[current=page]:underline"
            >
              {item.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
