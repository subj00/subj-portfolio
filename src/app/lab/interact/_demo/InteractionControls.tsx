"use client";

import { useEffect, useRef } from "react";
import { activateLabObject, LAB_INTERACT_ID } from "@/animation/sequences/lab-activate";
import { useDrag } from "@/interaction/use-drag";
import { usePointerTracker } from "@/interaction/use-pointer-tracker";
import { onTick } from "@/runtime/ticker";
import {
  lockInteractions,
  select,
  selectInteractionsLocked,
  uiStore,
  useUi,
} from "@/stores/ui-store";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2";

/** TEMPORARY. Keyboard equivalents, global state and DOM pointer hooks for /lab/interact. */
export function InteractionControls() {
  const selected = useUi((s) => s.selection === LAB_INTERACT_ID);
  const locked = useUi(selectInteractionsLocked);

  // Escape clears the selection; the listener exists only while something is selected.
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") select(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  // Selection is page-level: clear it when this page goes away (or is hidden by Activity).
  useEffect(
    () => () => {
      if (uiStore.getState().selection === LAB_INTERACT_ID) select(null);
    },
    [],
  );

  const simulateTransition = () => {
    const release = lockInteractions();
    setTimeout(release, 2000);
  };

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex flex-wrap gap-3">
        {/* aria-disabled instead of disabled: stays focusable and announced while locked. */}
        <button
          type="button"
          aria-pressed={selected}
          aria-disabled={locked}
          onClick={() => void activateLabObject()}
          className={`min-h-11 border px-3 aria-disabled:opacity-50 ${focusRing}`}
        >
          Activate object
        </button>
        <button
          type="button"
          onClick={simulateTransition}
          className={`min-h-11 border px-3 ${focusRing}`}
        >
          Simulate 2s transition (locks interactions)
        </button>
      </div>
      <p data-interaction-status>
        Selected: {selected ? "yes" : "no"} · Interactions: {locked ? "locked" : "enabled"}
        {selected && " · Press Escape to deselect"}
      </p>
      <PointerPad />
    </div>
  );
}

/**
 * DOM pointer hooks: live readout of element-local coordinates and velocity
 * (written to the DOM from the shared ticker, no React state), plus tap vs drag
 * counting with click suppression on the inner button.
 */
function PointerPad() {
  const pad = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLOutputElement>(null);
  const counts = useRef({ taps: 0, drags: 0, cancels: 0, clicks: 0 });
  const countsOut = useRef<HTMLOutputElement>(null);
  const sample = usePointerTracker(pad);

  const writeCounts = () => {
    const c = counts.current;
    if (countsOut.current) {
      countsOut.current.textContent = `taps ${c.taps} · drags ${c.drags} · cancelled ${c.cancels} · button clicks ${c.clicks}`;
    }
  };

  useDrag(pad, {
    axis: "x",
    onTap: () => {
      counts.current.taps++;
      writeCounts();
    },
    onEnd: ({ cancelled }) => {
      if (cancelled) counts.current.cancels++;
      else counts.current.drags++;
      writeCounts();
    },
  });

  useEffect(
    () =>
      onTick("render", () => {
        const s = sample.current;
        if (!readout.current || !s.inside) return;
        readout.current.textContent = `${s.pointerType} · x ${s.nx.toFixed(2)} y ${s.ny.toFixed(2)} · vx ${Math.round(s.vx)} px/s${s.pressed ? " · pressed" : ""}`;
      }),
    [sample],
  );

  return (
    <div
      ref={pad}
      data-pointer-pad
      className="grid min-h-40 place-items-center gap-2 border border-dashed p-4 select-none"
    >
      <p>Pointer pad: move, tap, or drag horizontally. Vertical touch swipes still scroll.</p>
      <output ref={readout}>outside</output>
      <output ref={countsOut}>taps 0 · drags 0 · cancelled 0 · button clicks 0</output>
      <button
        type="button"
        onClick={() => {
          counts.current.clicks++;
          writeCounts();
        }}
        className={`min-h-11 border px-3 ${focusRing}`}
      >
        Button inside pad (a drag starting here must not click it)
      </button>
    </div>
  );
}
