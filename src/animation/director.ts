import { gsap } from "./gsap";

/**
 * Coordinates sequences that span components (DOM + WebGL rigs, navigation,
 * intro). Component-local animation does NOT go through here: use useGSAP.
 *
 * Model: named, exclusive channels. Each channel runs at most one timeline;
 * starting a new sequence on a channel interrupts the current one. Two rules
 * keep sequences from fighting:
 *   1. A channel owns its targets' properties while it runs. Scroll timelines
 *      must not animate the same properties on the same targets.
 *   2. "page" channels end when the route changes; "app" channels survive.
 */

export type ChannelScope = "page" | "app";

/**
 * kill     – stop where it is (the next sequence continues from current values)
 * complete – jump to the end state, then stop
 * revert   – restore the values from before the sequence started
 */
export type Interruption = "kill" | "complete" | "revert";

interface PlayOptions {
  scope?: ChannelScope;
  /** How to stop whatever this channel was already running. */
  interrupt?: Interruption;
  timeline?: gsap.TimelineVars;
}

interface Running {
  timeline: gsap.core.Timeline;
  scope: ChannelScope;
}

const channels = new Map<string, Running>();

function end(timeline: gsap.core.Timeline, how: Interruption) {
  if (how === "revert") {
    timeline.revert();
    return;
  }
  if (how === "complete") timeline.progress(1);
  timeline.kill();
}

/** Builds and plays a sequence on `channel`, interrupting the previous one. */
export function play(
  channel: string,
  build: (timeline: gsap.core.Timeline) => void,
  { scope = "page", interrupt = "kill", timeline: vars }: PlayOptions = {},
): gsap.core.Timeline {
  stop(channel, interrupt);
  const onComplete = vars?.onComplete;
  const timeline = gsap.timeline({
    ...vars,
    onComplete() {
      if (channels.get(channel)?.timeline === timeline) channels.delete(channel);
      onComplete?.();
    },
  });
  build(timeline);
  channels.set(channel, { timeline, scope });
  return timeline;
}

export function stop(channel: string, how: Interruption = "kill") {
  const running = channels.get(channel);
  if (!running) return;
  channels.delete(channel);
  end(running.timeline, how);
}

/** Stops every channel in `scope`. Called on navigation for "page" channels. */
export function stopScope(scope: ChannelScope, how: Interruption = "revert") {
  for (const [channel, running] of channels) {
    if (running.scope === scope) stop(channel, how);
  }
}

export function isPlaying(channel: string) {
  return channels.has(channel);
}

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as Window & { __director?: unknown }).__director = { channels };
}
