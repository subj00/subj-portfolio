/** Minimal accessible page until a section is designed. */
export function PlaceholderPage({ title, body }: { title: string; body: string }) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="px-[var(--gutter-l)] pt-[calc(var(--header-h)+env(safe-area-inset-top)+3rem)] outline-none"
    >
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-2">{body}</p>
    </main>
  );
}
