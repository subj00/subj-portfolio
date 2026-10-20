/** First focusable element: jumps keyboard users past the header to <main id="main">. */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[Canvas] focus:px-3 focus:py-2 focus:text-[CanvasText]"
    >
      {label}
    </a>
  );
}
