"use client";

import { useRef } from "react";
import {
  gsap,
  MOTION_QUERIES,
  readMotionConditions,
  ScrollTrigger,
  useGSAP,
} from "@/animation/gsap";
import { type LayoutBox, layoutBox as box } from "@/animation/layout-box";
import { resettleOnRefresh } from "@/animation/scrubbed";

/**
 * "The Final Orbit": the Projects → Contact transition. One scrubbed
 * ScrollTrigger timeline over the screen between the two sections (Contact's
 * top entering the viewport → reaching its top). Projects has settled by then
 * (the Red Fracture ends when Projects reaches the top, and Projects is at
 * least one viewport tall), so the two never overlap.
 *
 * The project panels' energy converges and becomes the Contact orbits: it runs
 * along the panel frames (feeder lines in this component's overlay) to one hub
 * at the base of the middle panel; from there a single line (the trunk) drops
 * into Contact and swoops into the bright orbit where that orbit rises, along
 * the orbit's own direction. The real ellipse then grows both ways from that
 * point while the trunk's tail flows into it; the other orbits sprout from
 * their points nearest to it. No orbit is duplicated.
 *
 *   A 0.00–0.40  the frames brighten; segments travel along them to the hub;
 *                Projects starts to recede (still readable)
 *   B 0.36–0.64  the trunk leaves the hub and curves toward the bright orbit
 *   C 0.60–0.94  the orbits form from the join; dotted orbit, glowing points
 *   D 0.70–1.00  label, heading lines, introduction, contact panels, closing
 *
 * Desktop: one feeder per panel (outer panels along the shared bottom line).
 * Mobile: the last panel's energy runs down both sides and meets at its base;
 * fainter lines (the orbits are faint there) and no glow strokes.
 * Reduced motion: nothing (all visible).
 *
 * Ownership: the Projects header and list (the *parents* of the Red
 * Fracture's targets), the overlay, the orbits' dash/opacity and points'
 * opacity, and the data-contact parts. Geometry is re-measured on every
 * ScrollTrigger refresh: panels from layout offsets (unaffected by
 * transforms), orbits through their SVG matrices (only their opacity is
 * animated), so it follows any viewport.
 */

/** Feeder slots rendered; mobile uses the first two. */
const FEEDERS = 3;
/** The orbit the trunk becomes, and the ones that sprout from it (in order). */
const JOINED = "bright";
const SPROUTING = ["outer", "inner"] as const;

export function FinalOrbit() {
  const svg = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    const overlay = svg.current;
    const main = overlay?.closest("main");
    const projects = main?.querySelector<HTMLElement>("[data-section='projects']");
    const contact = main?.querySelector<HTMLElement>("[data-section='contact']");
    const orbitBox = contact?.querySelector<HTMLElement>("[data-contact='orbits']");
    const trunkGroup = overlay?.querySelector<SVGGElement>("g[data-trunk]");
    if (!overlay || !main || !projects || !contact || !orbitBox || !trunkGroup) return;
    const cards = [...projects.querySelectorAll<HTMLElement>("[data-projects='entry']")];
    const retreat = projects.querySelectorAll("[data-final='projects']");
    const dotted = contact.querySelector("g[data-orbit='dotted']");
    const points = contact.querySelectorAll("[data-orbit-point]");
    const parts = contact.querySelectorAll(
      "[data-contact='part'], [data-contact='title-line'], [data-contact='item'], [data-contact='closing']",
    );
    const slots = [...overlay.querySelectorAll<SVGGElement>("g[data-feeder]")];
    const orbit = (name: string) => {
      const group = contact.querySelector<SVGGElement>(`g[data-orbit='${name}']`);
      return group ? orbitModel(group) : null;
    };
    const joined = orbit(JOINED);
    const sprouting = SPROUTING.map(orbit).filter((o): o is OrbitModel => o !== null);
    if (cards.length === 0 || !joined || sprouting.length !== SPROUTING.length) return;
    const orbits = [joined, ...sprouting];

    const mm = gsap.matchMedia();
    mm.add(
      { ...MOTION_QUERIES, wide: "(width >= 48rem) and (orientation: landscape)" },
      (context) => {
        if (readMotionConditions(context).reduced) return;
        // The desktop composition needs the three panels side by side.
        const wide = Boolean((context.conditions as { wide?: boolean }).wide) && cards.length >= 3;
        const feeders = slots.slice(0, wide ? 3 : 2).map(line);
        const trunk = line(trunkGroup);
        for (const group of slots)
          group.style.display = feeders.some((f) => f.group === group) ? "" : "none";
        // Mobile: no glow strokes (cheaper, and the orbits there are faint).
        for (const glow of overlay.querySelectorAll<SVGPathElement>("[data-glow]"))
          glow.style.display = wide ? "" : "none";

        // Paths and joins from the real layout, in the overlay's coordinates.
        // Runs before every refresh measurement.
        const layout = () => {
          const origin = box(main);
          const top = box(projects).y - origin.y;
          const height = box(contact).y + contact.offsetHeight - origin.y - top;
          overlay.style.top = `${top}px`;
          overlay.style.height = `${height}px`;
          overlay.setAttribute("viewBox", `0 0 ${main.offsetWidth} ${height}`);
          const screen = main.getBoundingClientRect();
          const toLocal = (x: number, y: number) => ({
            x: x - screen.left,
            y: y - screen.top - top,
          });
          const local = (element: HTMLElement) => {
            const b = box(element);
            return { x: b.x - origin.x, y: b.y - origin.y - top, w: b.w, h: b.h };
          };
          const o = orbitBox.getBoundingClientRect();
          const region = visibleRegion(
            { ...toLocal(o.left, o.top), w: o.width, h: o.height },
            main.offsetWidth,
            wide,
          );
          // The join happens around 0.6, when Contact's top is ~0.4 of the
          // viewport down: keep it (and the dip of the curve into it) on screen.
          region.bottom = Math.min(region.bottom, local(contact).y + innerHeight * 0.42);

          const { routes, hub } = wide
            ? desktopRoutes(cards.slice(0, 3).map(local))
            : mobileRoutes(local(cards.at(-1)!));
          feeders.forEach((feeder, i) => {
            const route = routes[i]!;
            for (const path of feeder.paths) path.setAttribute("d", route.d);
            feeder.outline?.setAttribute("d", route.outline);
          });
          // Mobile: a shallower join and a shorter fall (narrow screen, softer turn).
          const join = joinPoint(samples(joined, toLocal), region, hub, wide ? 0.57 : 0.34);
          joined.start = join.share;
          const d = `M${hub.x},${hub.y} ${curveInto(hub, join, wide ? 0.5 : 0.35)}`;
          for (const path of trunk.paths) path.setAttribute("d", d);
          for (const o of sprouting) o.start = nearestShare(samples(o, toLocal), join);
        };
        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        // Dash state lives in plain objects (tweened) and is written in one place.
        const lines = [...feeders, trunk];
        const render = () => {
          for (const l of lines) {
            const tail = Math.min(l.tail, l.head);
            for (const path of l.paths) {
              path.style.strokeDasharray = `${l.head - tail} 2`;
              path.style.strokeDashoffset = `${-tail}`;
            }
          }
          for (const o of orbits) drawOrbit(o);
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: render,
          scrollTrigger: {
            trigger: contact,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              resettleOnRefresh(self);
              render();
            },
          },
        });
        const peak = wide ? 1 : 0.65;

        // A — Projects recedes, gently (the Red Fracture owns the panels themselves).
        tl.fromTo(
          retreat,
          { y: 0, opacity: 1 },
          { y: () => -0.05 * innerHeight, opacity: 0.2, duration: 0.5, ease: "power1.in" },
          0.12,
        );

        // A — the frames brighten; a segment runs along each, gathering speed,
        // and arrives at the hub.
        feeders.forEach((feeder, i) => {
          const at = i * (wide ? 0.03 : 0.02);
          tl.fromTo(feeder.group, { opacity: 0 }, { opacity: peak, duration: 0.04 }, at)
            .fromTo(feeder, { head: 0 }, { head: 1, duration: 0.4 - at, ease: "sine.in" }, at)
            .fromTo(
              feeder,
              { tail: 0 },
              { tail: 1, duration: 0.36 - at, ease: "sine.in" },
              at + 0.1,
            )
            .to(feeder.group, { opacity: 0, duration: 0.03 }, 0.45);
          if (feeder.outline)
            tl.fromTo(feeder.outline, { opacity: 0 }, { opacity: 1, duration: 0.16 }, at).to(
              feeder.outline,
              { opacity: 0, duration: 0.2, ease: "power1.in" },
              0.3,
            );
        });

        // B — the trunk leaves the hub and swoops into the bright orbit; its
        // tail then flows after it into the orbit.
        tl.fromTo(trunk.group, { opacity: 0 }, { opacity: peak, duration: 0.03 }, 0.36)
          .fromTo(trunk, { head: 0 }, { head: 1, duration: 0.26, ease: "power1.inOut" }, 0.37)
          .fromTo(trunk, { tail: 0 }, { tail: 1, duration: 0.2, ease: "power1.inOut" }, 0.6)
          .to(trunk.group, { opacity: 0, duration: 0.03 }, 0.8);

        // C — the orbits form: the bright one from the join, the others from
        // their nearest points; then the dotted orbit and the glowing points.
        orbits.forEach((o, i) => {
          const at = 0.61 + i * 0.04;
          tl.fromTo(o.group, { opacity: 0 }, { opacity: 1, duration: 0.02 }, at).fromTo(
            o.draw,
            { d: 0 },
            { d: 1, duration: 0.3 - i * 0.02, ease: "power2.out" },
            at,
          );
        });
        tl.fromTo(
          dotted,
          { opacity: 0 },
          { opacity: 1, duration: 0.24, ease: "power1.inOut" },
          0.64,
        ).fromTo(points, { opacity: 0 }, { opacity: 1, duration: 0.08, stagger: 0.04 }, 0.76);

        // D — the Contact content, in reading order.
        tl.fromTo(
          parts,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.14, ease: "power2.out", stagger: { amount: 0.16 } },
          0.7,
        );
        // Exactly 1 long, so scroll progress = timeline time (the stages above).
        tl.set({}, {}, 1);
        render();

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", layout);
          for (const o of orbits)
            for (const shape of o.shapes) {
              shape.style.removeProperty("stroke-dasharray");
              shape.style.removeProperty("stroke-dashoffset");
            }
        };
      },
    );
  });

  return (
    <svg
      ref={svg}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-0 w-full overflow-hidden"
      fill="none"
      preserveAspectRatio="none"
    >
      {Array.from({ length: FEEDERS }, (_, i) => (
        <g key={i} data-feeder={i} strokeLinecap="round" strokeLinejoin="round" opacity={0}>
          <path data-frame d="" stroke="rgb(255 48 56 / 0.55)" strokeWidth={1} opacity={0} />
          <Strokes core={i === 1 ? "rgb(255 90 96 / 0.95)" : "rgb(255 48 56 / 0.85)"} />
        </g>
      ))}
      <g data-trunk strokeLinecap="round" strokeLinejoin="round" opacity={0}>
        <Strokes core="rgb(255 90 96 / 0.95)" />
      </g>
    </svg>
  );
}

/** Glow (wide, faint) under the core (thin, bright): a cheap luminous line. */
function Strokes({ core }: { core: string }) {
  return (
    <>
      <path
        data-glow
        pathLength={1}
        strokeDasharray="0 2"
        stroke="rgb(255 30 40 / 0.16)"
        strokeWidth={7}
      />
      <path pathLength={1} strokeDasharray="0 2" stroke={core} strokeWidth={1.2} />
    </>
  );
}

interface Point {
  x: number;
  y: number;
}

type Box = LayoutBox;

interface Line {
  group: SVGGElement;
  /** Glow and core strokes (same path). */
  paths: SVGPathElement[];
  /** The panel frame, faintly brightened while the energy gathers. */
  outline: SVGPathElement | null;
  /** Visible segment, as shares of the path (0…1). */
  head: number;
  tail: number;
}

function line(group: SVGGElement): Line {
  return {
    group,
    paths: [...group.querySelectorAll<SVGPathElement>("path:not([data-frame])")],
    outline: group.querySelector<SVGPathElement>("[data-frame]"),
    head: 0,
    tail: 0,
  };
}

interface OrbitModel {
  group: SVGGElement;
  shapes: SVGEllipseElement[];
  /** Ellipse in its own user space. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  perimeter: number;
  /** Arc-length share at each sample angle (samples evenly in angle). */
  shares: number[];
  /** Where the outline starts growing (share of the perimeter), both ways. */
  start: number;
  draw: { d: number };
}

const SAMPLES = 180;

function orbitModel(group: SVGGElement): OrbitModel | null {
  const shapes = [...group.querySelectorAll("ellipse")];
  const first = shapes[0];
  if (!first) return null;
  const cx = first.cx.baseVal.value;
  const cy = first.cy.baseVal.value;
  const rx = first.rx.baseVal.value;
  const ry = first.ry.baseVal.value;
  // An ellipse's outline starts at (cx + rx, cy) and runs toward +angle
  // (SVG 2), so arc-length shares by angle map straight onto its dashes.
  const lengths = [0];
  for (let i = 1; i <= SAMPLES; i++) {
    const a = ((i - 1) / SAMPLES) * Math.PI * 2;
    const b = (i / SAMPLES) * Math.PI * 2;
    const step = Math.hypot(rx * (Math.cos(b) - Math.cos(a)), ry * (Math.sin(b) - Math.sin(a)));
    lengths.push(lengths[i - 1]! + step);
  }
  const perimeter = lengths[SAMPLES]!;
  return {
    group,
    shapes,
    cx,
    cy,
    rx,
    ry,
    perimeter,
    shares: lengths.map((length) => length / perimeter),
    start: 0,
    draw: { d: 0 },
  };
}

/** Writes the orbit's dash: a share d of its outline, centred on `start`. */
function drawOrbit(orbit: OrbitModel) {
  const { perimeter: p, draw, start } = orbit;
  const on = draw.d * p;
  const offset = (draw.d / 2 - start) * p;
  for (const shape of orbit.shapes) {
    shape.style.strokeDasharray = `${on} ${p - on}`;
    shape.style.strokeDashoffset = `${offset}`;
  }
}

interface Sample extends Point {
  share: number;
  /** Unit tangent in the outline's direction. */
  tx: number;
  ty: number;
}

/** The orbit's outline sampled in overlay coordinates (through its SVG matrix). */
function samples(orbit: OrbitModel, toLocal: (x: number, y: number) => Point): Sample[] {
  const matrix = orbit.shapes[0]!.getScreenCTM();
  const at = (i: number) => {
    const a = (i / SAMPLES) * Math.PI * 2;
    const p = new DOMPoint(orbit.cx + orbit.rx * Math.cos(a), orbit.cy + orbit.ry * Math.sin(a));
    const s = matrix ? p.matrixTransform(matrix) : p;
    return toLocal(s.x, s.y);
  };
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => at(i));
  return points.slice(0, SAMPLES).map((p, i) => {
    const q = points[i + 1]!;
    const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { ...p, share: orbit.shares[i]!, tx: (q.x - p.x) / length, ty: (q.y - p.y) / length };
  });
}

interface Region {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Where on screen an orbit reads clearly (inside its box, away from the mask). */
function visibleRegion(area: Box, width: number, wide: boolean): Region {
  return wide
    ? {
        left: area.x + area.w * 0.24, // the mask is opaque from 22%
        right: Math.min(area.x + area.w, width) - area.w * 0.06,
        top: area.y + area.h * 0.1,
        bottom: area.y + area.h * 0.9,
      }
    : {
        left: area.x + area.w * 0.4,
        right: Math.min(area.x + area.w, width) - area.w * 0.06,
        top: area.y + area.h * 0.12,
        bottom: area.y + area.h * 0.48,
      };
}

/**
 * Where the trunk joins the orbit: a visible point to the right of the hub
 * where the orbit rises to the right at about the angle whose sine is `target`, as far left
 * as that allows, so the line can fall from the hub and swoop up into it.
 * Returns the point with the rising direction (the way the line arrives).
 */
function joinPoint(points: Sample[], region: Region, hub: Point, target: number) {
  const span = region.right - region.left || 1;
  let best = points[0]!;
  let bestScore = Infinity;
  for (const p of points) {
    // Oriented rightward; rising means ty < 0 on screen.
    const sign = p.tx >= 0 ? 1 : -1;
    const rise = -p.ty * sign;
    const inside =
      p.x >= region.left && p.x <= region.right && p.y >= region.top && p.y <= region.bottom;
    const score =
      Math.abs(rise - target) * 3 +
      ((p.x - region.left) / span) * 1.2 +
      (p.x > hub.x + span * 0.15 ? 0 : 5) +
      (inside ? 0 : 1e6);
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  const sign = best.tx >= 0 ? 1 : -1;
  return { ...best, tx: best.tx * sign, ty: best.ty * sign };
}

/** Share of the orbit's sample nearest to `target`. */
function nearestShare(points: Sample[], target: Point) {
  const distance = (p: Point) => Math.hypot(p.x - target.x, p.y - target.y);
  let best = points[0]!;
  for (const p of points) if (distance(p) < distance(best)) best = p;
  return best.share;
}

interface Route {
  /** Along the frame to the hub. */
  d: string;
  /** The panel's full frame ("" when another feeder already brightens it). */
  outline: string;
}

/**
 * Desktop: the hub is the base of the middle panel. The outer panels' energy
 * climbs their outer side, crosses the top, descends the inner side and runs
 * along the shared bottom line to the hub; the middle panel's goes from its
 * top centre around its left half.
 */
function desktopRoutes([a, b, c]: Box[]): { routes: Route[]; hub: Point } {
  const hub = { x: b!.x + b!.w / 2, y: b!.y + b!.h };
  const bottom = (p: Box) => p.y + p.h;
  const right = (p: Box) => p.x + p.w;
  return {
    hub,
    routes: [
      {
        d: `M${a!.x},${bottom(a!)} V${a!.y} H${right(a!)} V${bottom(a!)} H${hub.x}`,
        outline: frameOf(a!),
      },
      { d: `M${hub.x},${b!.y} H${b!.x} V${bottom(b!)} H${hub.x}`, outline: frameOf(b!) },
      {
        d: `M${right(c!)},${bottom(c!)} V${c!.y} H${c!.x} V${bottom(c!)} H${hub.x}`,
        outline: frameOf(c!),
      },
    ],
  };
}

/** Mobile: from the last panel's top centre down both sides to its base centre (the hub). */
function mobileRoutes(c: Box): { routes: Route[]; hub: Point } {
  const hub = { x: c.x + c.w / 2, y: c.y + c.h };
  return {
    hub,
    routes: [
      { d: `M${hub.x},${c.y} H${c.x + c.w} V${hub.y} H${hub.x}`, outline: frameOf(c) },
      { d: `M${hub.x},${c.y} H${c.x} V${hub.y} H${hub.x}`, outline: "" },
    ],
  };
}

/** A panel's full rectangle. */
function frameOf(c: Box) {
  return `M${c.x},${c.y} H${c.x + c.w} V${c.y + c.h} H${c.x} Z`;
}

/** A cubic falling from `hub` and arriving at `join` along its direction. */
function curveInto(hub: Point, join: Point & { tx: number; ty: number }, drop: number) {
  const distance = Math.hypot(join.x - hub.x, join.y - hub.y);
  const fall = distance * drop;
  const settle = distance * 0.5;
  return `C${hub.x},${hub.y + fall} ${join.x - join.tx * settle},${join.y - join.ty * settle} ${join.x},${join.y}`;
}
