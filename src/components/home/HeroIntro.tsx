"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { isPlaying, play, stop } from "@/animation/director";
import { gsap } from "@/animation/gsap";
import {
  buildHeroIntro,
  type HeroIntroParts,
  INTRO_CHANNEL,
  INTRO_LATE_START,
} from "@/animation/sequences/hero-intro";
import { type StageStatus, stageStore } from "@/stores/stage-store";
import { lockInteractions } from "@/stores/ui-store";

/** Hydrated later than this (ms since navigation start): start at the ignition. */
const LATE_AFTER_MS = 1400;
/** Later than this: skip the intro, just show the hero (no second "loading" moment). */
const SKIP_AFTER_MS = 2800;
/** Longest the reveal waits for the sculpture. */
const HOLD_MAX_MS = 400;
/** Whatever happens, the hero is fully shown by then. */
const SAFETY_MS = 5000;

const SETTLED: ReadonlySet<StageStatus> = new Set(["ready", "unsupported", "error"]);

/**
 * The hero intro's overlay (server-rendered, shown only while html[data-intro]
 * is set) and its controller. Plays once, when the gate script decided so
 * (intro-gate.ts); otherwise renders nothing visible and does nothing.
 *
 * Interruption: a key press (e.g. Tab) jumps to the end; scrolling, wheel or a
 * tap speeds it up. Unmount (language switch, hidden route) completes it. At
 * the end the timeline is reverted: the rig returns to neutral and no inline
 * styles remain, so the hero is exactly its static self.
 */
export function HeroIntro() {
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = overlay.current;
    if (!element || document.documentElement.dataset.intro !== "play") return;
    let session: { complete: () => void } | null = null;
    // Deferred a frame: a Strict Mode mount/unmount pair cancels it instead of
    // completing a just-started intro.
    const frame = requestAnimationFrame(() => (session = startIntro(element)));
    return () => {
      cancelAnimationFrame(frame);
      session?.complete();
    };
  }, []);

  return (
    <div
      ref={overlay}
      data-intro-overlay
      aria-hidden
      style={{ "--intro-angle": "0deg" } as CSSProperties}
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden [--intro-x:50%] [--intro-y:40%] wide:[--intro-x:74%] wide:[--intro-y:52%]"
    >
      <div data-intro-shade className="absolute inset-0 bg-ink" />
      {/* Light streak: a bright beam with a faint trail; vertical in portrait. */}
      <div className="absolute top-[var(--intro-y)] left-[var(--intro-x)] h-0 w-[170vmax] -translate-1/2 rotate-[var(--intro-angle)]">
        <span
          data-intro-trail
          className="absolute inset-x-0 -top-px h-px origin-left bg-[linear-gradient(90deg,transparent,rgb(227_18_27/0.6)_30%,rgb(255_42_51/0.9)_50%,rgb(227_18_27/0.6)_70%,transparent)] opacity-0"
        />
        <span
          data-intro-beam
          className="absolute -top-[1.5px] left-0 h-[3px] w-[28vmax] rounded-full bg-[linear-gradient(90deg,transparent,rgb(255_42_51/0.85)_60%,rgb(255_214_214)_94%,transparent)] opacity-0 shadow-[0_0_0.9rem_0.2rem_rgb(255_30_40/0.7),0_0_2.5rem_0.5rem_rgb(200_0_10/0.45)]"
        />
      </div>
      <span
        data-intro-flash
        className="absolute top-[var(--intro-y)] left-[var(--intro-x)] size-[75vmin] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_70_70/0.5),rgb(200_0_12/0.26)_38%,transparent_72%)] opacity-0"
      />
      <span
        data-intro-ring
        className="absolute top-[var(--intro-y)] left-[var(--intro-x)] size-[26vmin] -translate-1/2 rounded-full border border-accent-bright/70 opacity-0"
      />
      <span
        data-intro-core
        className="absolute top-[var(--intro-y)] left-[var(--intro-x)] size-1.5 -translate-1/2 rounded-full bg-[#ff5a60] opacity-0 shadow-[0_0_0.6rem_0.2rem_rgb(255_40_50/0.95),0_0_2.25rem_0.75rem_rgb(200_0_12/0.55)]"
      />
    </div>
  );
}

function startIntro(overlay: HTMLElement): { complete: () => void } {
  const html = document.documentElement;
  html.dataset.intro = "running";
  const hero = overlay.closest("section");
  const parts = hero ? collectParts(overlay, hero) : null;
  const since = performance.now();
  if (!parts || since > SKIP_AFTER_MS) {
    delete html.dataset.intro;
    return { complete: () => {} };
  }

  // Centre the effects on the sculpture; the streak runs vertically in portrait.
  const anchor = hero?.querySelector("[data-scene-anchor='hero/sculpture']");
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    overlay.style.setProperty("--intro-x", `${r.left + r.width / 2}px`);
    overlay.style.setProperty("--intro-y", `${r.top + r.height / 2}px`);
  }
  overlay.style.setProperty("--intro-angle", innerHeight > innerWidth ? "90deg" : "0deg");

  performance.mark("intro:start"); // measurable in devtools (Performance panel)
  const targets = [...Object.values(parts).flat()];
  const unlock = lockInteractions(); // no 3D clicks/hover until it settles
  let cancelHold = () => {};
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(safety);
    cancelHold();
    for (const type of ["wheel", "touchmove", "pointerdown"]) removeEventListener(type, hurry);
    removeEventListener("keydown", complete);
    unlock();
    performance.mark("intro:end");
    delete html.dataset.intro;
    timeline.revert(); // rig back to neutral
    // GSAP folds CSS translate (Tailwind's -translate-*) into an inline transform
    // that revert leaves behind; clear exactly what the intro animated.
    gsap.set(targets, { clearProps: "transform,translate,rotate,scale,opacity,clipPath" });
    if (isPlaying(INTRO_CHANNEL)) stop(INTRO_CHANNEL);
  };
  const complete = () => {
    timeline.progress(1, true);
    finish();
  };
  const hurry = () => {
    timeline.timeScale(3);
  };

  const timeline = play(
    INTRO_CHANNEL,
    (tl) => buildHeroIntro(tl, parts, (resume) => (cancelHold = holdForStage(resume))),
    { scope: "app", interrupt: "complete", timeline: { onComplete: () => queueMicrotask(finish) } },
  );
  if (since > LATE_AFTER_MS) timeline.seek(INTRO_LATE_START);
  // Dev only: ?introSpeed=0.25 plays it in slow motion for inspection.
  const speed =
    process.env.NODE_ENV !== "production"
      ? Number(new URLSearchParams(location.search).get("introSpeed")) || 1
      : 1;
  if (speed !== 1) timeline.timeScale(speed);

  for (const type of ["wheel", "touchmove", "pointerdown"]) {
    addEventListener(type, hurry, { passive: true });
  }
  addEventListener("keydown", complete);
  const safety = setTimeout(complete, SAFETY_MS / speed);
  return { complete };
}

function collectParts(overlay: HTMLElement, hero: HTMLElement): HeroIntroParts | null {
  const get = (root: ParentNode, selector: string) => root.querySelector<HTMLElement>(selector);
  const nameBox = get(hero, "[data-intro-el='name']");
  const name = nameBox?.querySelector("img");
  const edge = get(hero, "[data-intro-edge]");
  const shade = get(overlay, "[data-intro-shade]");
  const core = get(overlay, "[data-intro-core]");
  const beam = get(overlay, "[data-intro-beam]");
  const trail = get(overlay, "[data-intro-trail]");
  const flash = get(overlay, "[data-intro-flash]");
  const ring = get(overlay, "[data-intro-ring]");
  if (!nameBox || !name || !edge || !shade || !core || !beam || !trail || !flash || !ring) {
    return null;
  }
  // The header is the visible one (other locales' shells may be cached, hidden).
  const header = [...document.querySelectorAll("[data-intro-el='chrome']")].find(
    (element) => element.checkVisibility?.() ?? true,
  );
  const reveals = [
    get(hero, "[data-intro-el='eyebrow']"),
    get(hero, "[data-intro-el='intro']"),
    get(hero, "[data-intro-el='cta']"),
    header,
    get(hero, "[data-intro-el='scroll']"),
  ].filter((element): element is HTMLElement => element instanceof HTMLElement);
  return { shade, core, beam, trail, flash, ring, name, nameBox, edge, reveals };
}

/**
 * Resumes once the stage has settled (sculpture loaded, or WebGL unavailable)
 * plus two frames for its first render, or after HOLD_MAX_MS at most.
 * Returns a cancel function.
 */
function holdForStage(resume: () => void): () => void {
  let frame = 0;
  let resumed = false;
  const go = () => {
    if (resumed) return;
    resumed = true;
    unsubscribe();
    clearTimeout(timer);
    resume();
  };
  const settle = () => (frame = requestAnimationFrame(() => (frame = requestAnimationFrame(go))));
  const unsubscribe = stageStore.subscribe((s) => SETTLED.has(s.status) && settle());
  const timer = setTimeout(go, HOLD_MAX_MS);
  if (SETTLED.has(stageStore.getState().status)) settle();
  return () => {
    resumed = true;
    unsubscribe();
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
}
