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

`/lab` and `/lab/alt` are temporary verification routes (noindex). Delete them with
`src/webgl/scenes/lab` once real scenes exist.

## Next.js 16 notes

`cacheComponents` is on, so up to 3 visited routes stay mounted but hidden (React `<Activity>`).
Effects clean up when a route is hidden and run again when it is shown. Animation and scene code
must set up and tear down idempotently in effects, never once at module load.
