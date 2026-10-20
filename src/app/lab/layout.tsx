import type { Metadata } from "next";
import Link from "next/link";

// TEMPORARY: architecture verification routes. Remove with src/webgl/scenes/lab.
export const metadata: Metadata = {
  title: "WebGL lab",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: LayoutProps<"/lab">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Lab">
        <ul className="flex gap-4 underline">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/lab">Lab A</Link>
          </li>
          <li>
            <Link href="/lab/alt">Lab B</Link>
          </li>
          <li>
            <Link href="/lab/scroll">Scroll</Link>
          </li>
        </ul>
      </nav>
      <p className="mt-4 hidden in-data-[webgl=error]:block in-data-[webgl=unsupported]:block">
        WebGL is unavailable on this device; the page content still works.
      </p>
      {children}
    </div>
  );
}
