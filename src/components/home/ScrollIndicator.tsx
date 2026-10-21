/**
 * Decorative scroll hint (aria-hidden: it conveys nothing a user needs, and
 * scrolling works as usual). Mobile: centred at the bottom, horizontal label.
 * Wide: vertical at the right edge, label reading bottom-to-top.
 * Scroll-linked motion is added in a later step.
 */
export function ScrollIndicator({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      data-intro-el="scroll"
      className="pointer-events-none absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[1] flex -translate-x-1/2 flex-col items-center gap-3 wide:top-[44%] wide:right-[var(--gutter-r)] wide:bottom-auto wide:left-auto wide:translate-x-1/2"
    >
      <span className="flex flex-col items-center">
        <span className="h-7 w-px bg-paper/70 wide:h-[2vw]" />
        <span className="hidden h-[4.5vw] w-px bg-line wide:block" />
      </span>
      <span className="text-[0.5625rem] tracking-[0.35em] text-mist uppercase wide:rotate-180 wide:text-[clamp(0.5rem,0.6vw,0.6875rem)] wide:[writing-mode:vertical-rl]">
        {label}
      </span>
    </div>
  );
}
