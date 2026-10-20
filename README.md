# subj-portfolio

Personal frontend portfolio: a statically rendered Next.js site with a persistent WebGL stage and
GSAP-driven animation layered on top.

## Requirements

- Node 24 (see `.node-version`)
- pnpm via Corepack: `corepack enable pnpm` (the version is pinned in `package.json`)

## Scripts

| Script           | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Dev server (Turbopack)                             |
| `pnpm build`     | Production build                                   |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit`          |
| `pnpm lint`      | ESLint, zero warnings allowed                      |
| `pnpm format`    | Prettier write (`format:check` to verify)          |
| `pnpm test`      | Vitest unit tests (`test:watch` for watch mode)    |
| `pnpm check`     | Everything above, in CI order. Run before pushing. |

## Architecture rules

- **The DOM is the source of truth.** All content is server-rendered; WebGL is a decorative,
  lazily loaded enhancement with a DOM fallback.
- **One clock.** GSAP's ticker drives Lenis, ScrollTrigger and the R3F render loop.
- **No per-frame React state.** GSAP writes into plain mutable "rig" objects; `useFrame` reads them.
  Zustand holds low-frequency state only.
- **One owner per animated property.** Scroll, pointer and idle motion live on separate transform
  layers.
- **Import boundaries** (enforced by ESLint):
  - `src/content`, `src/types`: pure data, import nothing but each other.
  - `src/app`, `src/components`: never import `three`, `@react-three/*` or `@/webgl/*`.

Folders are added in the phase that first needs them (`content/`, `animation/`, …).

## WebGL stage

| Path                             | Role                                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| `src/runtime/ExperienceRoot.tsx` | Root-layout client boundary; lazy-loads the Stage on first scene use  |
| `src/runtime/ticker.ts`          | The single frame clock (`gsap.ticker`), phases `layout` → `render`    |
| `src/runtime/scene/`             | `SceneAnchor`, anchor registry, scene keys (no three.js)              |
| `src/stores/stage-store.ts`      | Low-frequency Stage state: status, quality tier, scene ref counts     |
| `src/webgl/Stage.tsx`            | Persistent canvas, render loop, camera projection, context-loss guard |
| `src/webgl/scenes/registry.ts`   | `SceneKey` → lazily loaded scene component                            |
| `src/webgl/anchor-projection.ts` | DOM rect → world position/size (`sampleAnchor`)                       |

Using a scene from a page:

```tsx
// Server component: declares the scene and gives its objects a DOM box to follow.
<SceneAnchor scene="lab" name="target" className="aspect-square" />
```

```tsx
// Inside the scene: sample the anchor each frame, no React state involved.
useFrame(({ camera, size }) => {
  if (sampleAnchor("lab", "target", camera, size, frame)) group.position.copy(frame.position);
});
```

## Hero sculpture

`src/webgl/scenes/hero/` (Scene Registry key `hero`, anchored by `SceneAnchor hero/sculpture` in
the hero's scene slot; CSS decides its box per layout):

- `sculpture-geometry.ts` – procedural core, sphere-projected shells (merged), energy trails, sparks
- `materials.ts` – glossy physical materials + injected flowing cracks / red rim; additive trails
- `red-environment.ts` – red-and-black HDR reflection environment (PMREM), per material
- `HeroScene.tsx` – layers: anchor → scroll rig (`sceneRigs.hero`, Step 4) → pointer tilt → ambient

The renderer uses Neutral tone mapping (ACES shifts saturated reds toward orange).

## Animation and interaction

| Path                                              | Role                                                          |
| ------------------------------------------------- | ------------------------------------------------------------- |
| `src/animation/gsap.ts`                           | Only place GSAP plugins are registered; `MOTION_QUERIES`      |
| `src/animation/smooth-scroll.ts`                  | Single Lenis instance on the shared ticker                    |
| `src/animation/AnimationRuntime.tsx`              | Lenis lifecycle, ScrollTrigger refresh, route-change handling |
| `src/animation/director.ts`                       | Exclusive channels for cross-component sequences              |
| `src/animation/scroll-lock.ts`                    | Counted background scroll lock (menu, dialogs); pauses Lenis  |
| `src/runtime/scene/scene-rigs.ts`                 | Plain-number rigs: GSAP writes, scenes read in `useFrame`     |
| `src/interaction/`                                | Gesture math, `usePointerTracker`, `useDrag` (DOM)            |
| `src/webgl/interaction/use-object-interaction.ts` | Hover/tap/drag for R3F objects on R3F's own raycasting        |
| `src/stores/ui-store.ts`                          | Menu, navigation pending, selection, interaction locks        |
| `src/components/navigation/`                      | `SectionLink`, `SectionNav`, `TransitionLink`, `NavMenu`      |

Ownership: one writer per transform layer (anchor → scroll/motion → pointer → drag → spin);
component-local animation uses `useGSAP`; only cross-component sequences use the Director.

## One-page structure

The portfolio is a single continuous page per locale (`/sr`, `/en`). Its sections, in scroll
order, are defined in `src/i18n/sections.ts` with localized anchors:

| Section  | Serbian     | English     |
| -------- | ----------- | ----------- |
| Home     | `#pocetna`  | `#home`     |
| About    | `#o-meni`   | `#about`    |
| Projects | `#projekti` | `#projects` |
| Contact  | `#kontakt`  | `#contact`  |

- Each section is a `PortfolioSection` (registers with section activation → nav current item).
- `SectionLink` is a real `next/link` to `/sr#o-meni`: works without JS and in new tabs; on the
  page it lets Next push the history entry, waits until the browser has saved the scroll position
  of the entry being left, then scrolls smoothly (Lenis, or native on touch; instant with reduced
  motion) and moves focus into the section. Back/Forward restore exact positions.
- The language switcher keeps the current section (`/sr#projekti` ⇄ `/en#projects`).
- New routes (e.g. project detail pages) go in `src/i18n/routes.ts` and `app/[lang]/…`.

## Temporary lab routes

`/lab`, `/lab/alt`, `/lab/scroll` and `/lab/interact` are verification routes (noindex). Delete
`src/app/lab`, `src/webgl/scenes/lab`, `src/animation/sequences/lab-activate.ts` and the `lab`
entries in `scene-keys.ts`, `scene-rigs.ts` and `scenes/registry.ts` once real scenes exist.

## Next.js 16 notes

`cacheComponents` is on, so up to 3 visited routes stay mounted but hidden (React `<Activity>`).
Effects clean up when a route is hidden and run again when it is shown. Animation and scene code
must set up and tear down idempotently in effects, never once at module load.
