import type { ReactNode } from "react";
import { ExperienceRoot } from "@/runtime/ExperienceRoot";
import "@/styles/globals.css";

/**
 * <html>/<body> shell shared by every root layout ([lang] and the lab group).
 * ExperienceRoot (WebGL stage, animation runtime) lives inside each root layout,
 * so it persists across navigation within one locale.
 */
export function RootDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html lang={lang}>
      <body>
        <ExperienceRoot>{children}</ExperienceRoot>
      </body>
    </html>
  );
}
