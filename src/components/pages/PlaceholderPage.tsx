/** Minimal accessible page until a section is designed. */
export function PlaceholderPage({ title, body }: { title: string; body: string }) {
  return (
    <main id="main" tabIndex={-1} className="px-4">
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-2">{body}</p>
    </main>
  );
}
