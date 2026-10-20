"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { scrollToElement, visibleElementById } from "@/animation/scroll-to";
import type { Locale } from "@/i18n/config";
import { type SectionKey, sectionHref, sectionId } from "@/i18n/sections";
import { setMenuOpen, uiStore } from "@/stores/ui-store";

type AnchorProps = Omit<ComponentProps<"a">, "href" | "onClick">;

/** Frames to wait after the URL updates (see onClick), and an overall cap (~0.2s). */
const SETTLE_FRAMES = 3;
const MAX_WAIT_FRAMES = 12;

/**
 * Link to a section of the one-page portfolio (e.g. /sr#o-meni).
 *
 * It is a real next/link, so it works without JavaScript, in new tabs, and from
 * other routes (Next navigates to the page, then the browser jumps to the hash).
 * On the page itself, Next records the history entry (Back returns to the
 * previous section) while we scroll smoothly through the active scroller, then
 * move focus to the section so keyboard and screen-reader users land there too.
 */
export function SectionLink({
  locale,
  section,
  ...props
}: AnchorProps & { locale: Locale; section: SectionKey }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return; // new tab / window: leave it to the browser
    }
    const target = visibleElementById(sectionId(locale, section));
    if (!target) return; // not on this page: normal navigation

    // Closing the menu releases its scroll lock in an effect; scroll after that.
    const menuWasOpen = uiStore.getState().menuOpen;
    if (menuWasOpen) setMenuOpen(false);

    // Back restores the scroll position the browser saved for the entry being
    // left, and (verified in Chrome) it saves it a frame or two AFTER Next's
    // pushState. So wait until the URL shows the new hash, then two more frames,
    // before moving: Back then returns exactly to where the user was.
    const hash = `#${target.id}`;
    const alreadyThere = window.location.hash === hash && !menuWasOpen; // no new entry
    let frames = 0;
    let settled = 0;
    const go = () => {
      frames += 1;
      if (window.location.hash === hash) settled += 1;
      if (!alreadyThere && settled < SETTLE_FRAMES && frames < MAX_WAIT_FRAMES) {
        requestAnimationFrame(go);
        return;
      }
      scrollToElement(target);
      target.focus({ preventScroll: true });
    };
    go();
  };

  return <Link {...props} href={sectionHref(locale, section)} scroll={false} onClick={onClick} />;
}
