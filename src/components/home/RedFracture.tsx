"use client";

import { useRef } from "react";
import {
  gsap,
  MOTION_QUERIES,
  readMotionConditions,
  ScrollTrigger,
  useGSAP,
} from "@/animation/gsap";
import { resettleOnRefresh } from "@/animation/scrubbed";

/**
 * "The Red Fracture": the About → Projects transition. One scrubbed
 * ScrollTrigger timeline over the screen between the two sections (Projects'
 * top entering the viewport → reaching its top). On desktop About is one
 * viewport tall, so it starts exactly where the Red Shift ends: no overlap.
 *
 * Thin red filaments (SVG, this component's overlay) leave the About scene and
 * become the borders of the project panels: each path runs from its source to
 * a panel's corner and then traces that panel's frame; as it completes, the
 * real panel fades in under it and the filament fades out.
 *
 *   A 0.00–0.25  the portrait's red atmosphere intensifies; About starts to
 *                recede; the first short fracture strokes appear
 *   B 0.20–0.60  filaments draw out across the dark toward the projects
 *   C 0.45–0.85  they reach the panels and trace their frames; the numbers
 *                appear in sequence; the panels take over from the lines
 *   D 0.70–1.00  heading, then each panel's category, title/description, link
 *
 * Desktop: five filaments from the portrait (one per panel + two short ones).
 * Mobile: the portrait is far above by then, so two filaments grow out of the
 * About timeline's red rail into the first panel's frame; panels 2 and 3
 * reveal as they enter the viewport. Reduced motion: nothing (all visible).
 *
 * Ownership: it animates the *parents* of the Red Shift's targets in About
 * (intro column, portrait figure, timeline list) and the data-projects parts.
 * Geometry is computed from layout offsets (unaffected by the timeline's own
 * transforms) on every ScrollTrigger refresh, so it follows any viewport.
 */

/** Filament slots rendered; mobile uses the first two. */
const FILAMENTS = 5;

export function RedFracture() {
  const svg = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    const overlay = svg.current;
    const main = overlay?.closest("main");
    const about = main?.querySelector<HTMLElement>("[data-section='about']");
    const projects = main?.querySelector<HTMLElement>("[data-section='projects']");
    if (!overlay || !main || !about || !projects) return;
    const pick = (root: ParentNode, name: string) =>
      root.querySelector<HTMLElement>(`[data-fracture='${name}']`);
    const portrait = pick(about, "about-portrait");
    const glow = pick(about, "glow");
    const aboutParts = ["about-intro", "about-portrait", "about-timeline"]
      .map((name) => pick(about, name))
      .filter((element): element is HTMLElement => element !== null);
    const lastRow = [...about.querySelectorAll<HTMLElement>("[data-shift='about-row']")].at(-1);
    const cards = [...projects.querySelectorAll<HTMLElement>("[data-projects='entry']")];
    const heading = projects.querySelectorAll("[data-projects='heading-part']");
    const groups = [...overlay.querySelectorAll<SVGGElement>("g[data-filament]")];
    if (!portrait || !glow || !lastRow || cards.length === 0) return;

    const mm = gsap.matchMedia();
    mm.add(
      { ...MOTION_QUERIES, wide: "(width >= 48rem) and (orientation: landscape)" },
      (context) => {
        if (readMotionConditions(context).reduced) return;
        const wide = Boolean((context.conditions as { wide?: boolean }).wide);
        const used = groups.slice(0, wide ? FILAMENTS : 2);
        for (const group of groups) group.style.display = used.includes(group) ? "" : "none";

        // Paths from the real layout, in the overlay's coordinates. Runs before
        // every refresh measurement, so a resize or layout change re-plans them.
        const layout = () => {
          const origin = box(main);
          const top = box(about).y - origin.y;
          const height = box(projects).y + projects.offsetHeight - origin.y - top;
          overlay.style.top = `${top}px`;
          overlay.style.height = `${height}px`;
          overlay.setAttribute("viewBox", `0 0 ${main.offsetWidth} ${height}`);
          const local = (element: HTMLElement) => {
            const b = box(element);
            return { x: b.x - origin.x, y: b.y - origin.y - top, w: b.w, h: b.h };
          };
          const paths = wide
            ? desktopPaths(local(portrait), cards.map(local))
            : mobilePaths(local(lastRow), local(cards[0]!), railX(lastRow, origin.x));
          used.forEach((group, i) => {
            for (const path of group.querySelectorAll("path"))
              path.setAttribute("d", paths[i] ?? "");
          });
        };
        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        const strokes = used.map((group) => group.querySelectorAll("path"));
        const cardFrames = wide ? cards : cards.slice(0, 1);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: projects,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: resettleOnRefresh,
          },
        });

        // A — the red atmosphere intensifies; About recedes.
        tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.in" }, 0)
          .to(glow, { opacity: 0, duration: 0.25, ease: "power1.out" }, 0.4)
          .fromTo(
            aboutParts,
            { y: 0, opacity: 1 },
            { y: () => -0.06 * innerHeight, opacity: 0.25, duration: 0.55, ease: "power1.in" },
            0.05,
          );

        // B/C — filaments draw out and trace the panel frames (pathLength = 1).
        // The two short fracture strokes (desktop slots 3–4) draw and fade early.
        strokes.forEach((paths, i) => {
          const isFrame = wide ? i < cards.length : true;
          const start = isFrame ? 0.18 + i * 0.05 : 0.12 + (i - 3) * 0.04;
          const length = isFrame ? 0.6 - i * 0.03 : 0.28;
          tl.fromTo(
            paths,
            { strokeDashoffset: 1 },
            // autoRound off: with pathLength = 1 the offset lives in 0…1, and
            // GSAP's default px rounding would make the line pop instead of draw.
            { strokeDashoffset: 0, duration: length, ease: "power1.inOut", autoRound: false },
            start,
          )
            .fromTo(paths, { opacity: 0 }, { opacity: 1, duration: 0.06 }, start)
            .to(
              paths,
              { opacity: 0, duration: 0.12 },
              isFrame ? start + length : start + length - 0.05,
            );
        });

        // C — the panels take over from their traced frames; numbers in sequence.
        tl.fromTo(
          cardFrames,
          { opacity: 0 },
          { opacity: 1, duration: 0.12, ease: "power1.out", stagger: 0.05 },
          0.7,
        ).fromTo(
          cardFrames.map((card) => card.querySelector("[data-projects='number']")),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.1, ease: "power2.out", stagger: 0.05 },
          0.72,
        );

        // D — heading, then each panel's content.
        tl.fromTo(
          heading,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.16, ease: "power2.out", stagger: 0.04 },
          0.7,
        ).fromTo(
          cardFrames.flatMap((card) => [...card.querySelectorAll("[data-projects='part']")]),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.12, ease: "power2.out", stagger: 0.025 },
          0.78,
        );
        // Exactly 1 long, so scroll progress = timeline time (the stages above).
        tl.set({}, {}, 1);

        // Mobile: panels 2 and 3 reveal as they enter the viewport.
        if (!wide) {
          for (const card of cards.slice(1)) {
            gsap
              .timeline({
                defaults: { ease: "power2.out" },
                scrollTrigger: { trigger: card, start: "top 92%", end: "top 62%", scrub: true },
              })
              .fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
              .fromTo(
                card.querySelector("[data-projects='number']"),
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.3 },
                0.15,
              )
              .fromTo(
                card.querySelectorAll("[data-projects='part']"),
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 },
                0.3,
              );
          }
        }

        return () => ScrollTrigger.removeEventListener("refreshInit", layout);
      },
    );
  });

  return (
    <svg
      ref={svg}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-0 w-full overflow-visible"
      fill="none"
      preserveAspectRatio="none"
    >
      {Array.from({ length: FILAMENTS }, (_, i) => (
        // Glow (wide, faint) under the core (thin, bright): a cheap luminous line.
        <g key={i} data-filament={i} strokeLinecap="round" strokeLinejoin="round">
          <path
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1}
            stroke="rgb(255 30 40 / 0.16)"
            strokeWidth={7}
            opacity={0}
          />
          <path
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1}
            stroke={i % 2 ? "rgb(255 48 56 / 0.85)" : "rgb(255 90 96 / 0.95)"}
            strokeWidth={i < 3 ? 1.2 : 0.8}
            opacity={0}
          />
        </g>
      ))}
    </svg>
  );
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Document-space layout box from offsets: ignores CSS transforms (incl. ours). */
function box(element: HTMLElement): Box {
  let x = 0;
  let y = 0;
  for (let e: HTMLElement | null = element; e; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y, w: element.offsetWidth, h: element.offsetHeight };
}

/** x of the About timeline's red rail (centre of a row's dot), overlay coordinates. */
function railX(row: HTMLElement, originX: number) {
  const node = row.children[1] as HTMLElement | undefined;
  return node ? box(node).x - originX + node.offsetWidth / 2 : box(row).x - originX + 40;
}

/**
 * From the portrait into each panel's frame, plus two short angular strokes.
 * Panel 1 is entered at its top-right corner (right of the section title),
 * panels 2 and 3 at their top-left corners (left of the intro line), so no
 * filament crosses the heading; each then traces its frame back to the corner.
 * The short strokes leave the portrait's lower corners, below the About text.
 */
function desktopPaths(p: Box, cards: Box[]): string[] {
  const sources = [
    { x: p.x + p.w * 0.18, y: p.y + p.h * 0.92 },
    { x: p.x + p.w * 0.5, y: p.y + p.h },
    { x: p.x + p.w * 0.86, y: p.y + p.h * 0.88 },
  ];
  const frames = cards.slice(0, 3).map((c, i) => {
    const s = sources[i]!;
    const right = c.x + c.w;
    const bottom = c.y + c.h;
    const cornerX = i === 0 ? right : c.x;
    const drop = c.y - s.y;
    const curve = `M${s.x},${s.y} C${s.x},${s.y + drop * 0.55} ${cornerX},${c.y - drop * 0.45} ${cornerX},${c.y}`;
    return i === 0
      ? `${curve} H${c.x} V${bottom} H${right} Z`
      : `${curve} H${right} V${bottom} H${c.x} Z`;
  });
  const fractures = [
    `M${p.x + p.w},${p.y + p.h * 0.86} L${p.x + p.w * 1.3},${p.y + p.h * 1.02} L${p.x + p.w * 1.62},${p.y + p.h * 1.06}`,
    `M${p.x},${p.y + p.h * 0.9} L${p.x - p.w * 0.24},${p.y + p.h * 1.04} L${p.x - p.w * 0.5},${p.y + p.h * 1.08}`,
  ];
  return [...frames, ...fractures];
}

/** Two filaments from the timeline rail into the first panel: top→right, left→bottom. */
function mobilePaths(row: Box, c: Box, x: number): string[] {
  const y = row.y + row.h;
  const drop = c.y - y;
  const corner = `M${x},${y} C${x},${y + drop * 0.6} ${c.x},${c.y - drop * 0.4} ${c.x},${c.y}`;
  return [`${corner} H${c.x + c.w} V${c.y + c.h}`, `${corner} V${c.y + c.h} H${c.x + c.w}`];
}
