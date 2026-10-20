"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { watchMedia } from "@/lib/device";
import { invalidateAnchors } from "@/runtime/scene/anchors";
import { motionStore } from "@/stores/motion-store";
import { endNavigation } from "@/stores/ui-store";
import { stopScope } from "./director";
import { MOTION_QUERIES, ScrollTrigger } from "./gsap";
import { acquireSmoothScroll, isSmoothScrollActive, syncSmoothScroll } from "./smooth-scroll";

/** Smooth scrolling only for wheel/trackpad devices without a reduced-motion preference. */
const SMOOTH_SCROLL_QUERY = `${MOTION_QUERIES.finePointer} and ${MOTION_QUERIES.motion}`;
const REFRESH_DEBOUNCE_MS = 150;

/**
 * App-wide animation lifecycle, mounted once by ExperienceRoot:
 *  - starts/stops Lenis as device capabilities and motion preferences change
 *  - refreshes ScrollTrigger (and anchor rects) when document layout changes
 *  - on navigation: ends page-scoped Director sequences, re-syncs scroll state
 */
export function AnimationRuntime() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  // Mounting means a route committed too: a navigation that changes the root
  // layout (e.g. switching language) remounts this runtime instead of changing
  // `pathname` under it, and must still release the navigation lock.
  useEffect(() => endNavigation(), []);

  useEffect(() => {
    let release: (() => void) | null = null;
    const update = () => motionStore.setState({ smoothScroll: isSmoothScrollActive() });
    const unwatch = watchMedia(SMOOTH_SCROLL_QUERY, (enabled) => {
      if (enabled) release ??= acquireSmoothScroll();
      else {
        release?.();
        release = null;
      }
      update();
    });
    return () => {
      unwatch();
      release?.();
      update();
    };
  }, []);

  useEffect(() => {
    // ScrollTrigger handles window resizes itself. Content height changes
    // (route content, images, Activity hiding a route) need an explicit refresh.
    let measuredHeight = document.documentElement.scrollHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onRefresh = () => {
      measuredHeight = document.documentElement.scrollHeight;
      invalidateAnchors(); // keep anchor rects consistent with trigger positions
    };
    const scheduleRefresh = () => {
      // Ignore observer callbacks caused by ScrollTrigger's own pin spacing.
      if (document.documentElement.scrollHeight === measuredHeight) return;
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), REFRESH_DEBOUNCE_MS);
    };

    ScrollTrigger.addEventListener("refresh", onRefresh);
    const observer = new ResizeObserver(scheduleRefresh);
    observer.observe(document.body);
    let active = true;
    void document.fonts.ready.then(() => active && ScrollTrigger.refresh());

    return () => {
      active = false;
      clearTimeout(timer);
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    // The route committed (link, back/forward or redirect): release navigation
    // locks and page-level UI state, end page-scoped sequences.
    endNavigation();
    stopScope("page");
    // Next.js sets the scroll position for the new route during commit; sync after it.
    const frame = requestAnimationFrame(() => {
      syncSmoothScroll();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
