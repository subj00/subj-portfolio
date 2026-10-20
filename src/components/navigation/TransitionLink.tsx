"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { beginNavigation } from "@/stores/ui-store";

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
// Generic like next/link itself, so typed routes (including [lang] paths) are checked per call.
export function TransitionLink<RouteType>({ onNavigate, href, ...props }: LinkProps<RouteType>) {
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
