"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { beginNavigation } from "@/stores/ui-store";

type TransitionLinkProps = ComponentProps<typeof Link>;

/**
 * next/link plus navigation state. It does not animate (yet): it marks a
 * client navigation as pending, which closes the menu and locks interactive
 * objects until AnimationRuntime sees the new route commit.
 *
 * Everything else stays native: prefetching, modifier/middle clicks (new tab,
 * no onNavigate), keyboard activation, and history. Back/forward never pass
 * through here and simply commit.
 *
 * Future phases add leave/enter sequences here via the Director.
 */
export function TransitionLink({ onNavigate, href, ...props }: TransitionLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        onNavigate?.(event);
        // Same-route links (hash or identical path) never change the pathname,
        // so they must not enter the navigating state.
        const target = typeof href === "string" ? href : (href.pathname ?? "");
        const targetPath = target.split(/[?#]/)[0];
        if (targetPath && targetPath !== pathname) beginNavigation();
      }}
    />
  );
}
