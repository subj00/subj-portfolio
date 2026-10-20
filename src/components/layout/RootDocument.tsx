import { Jost } from "next/font/google";
import type { ReactNode } from "react";
import { ExperienceRoot } from "@/runtime/ExperienceRoot";
import "@/styles/globals.css";

// Geometric sans for labels, navigation and body copy. Self-hosted by next/font
// at build time (no runtime request to Google); latin-ext covers č ć š ž đ.
const jost = Jost({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jost",
  display: "swap",
});

/**
 * <html>/<body> shell shared by every root layout ([lang] and the lab group).
 * ExperienceRoot (WebGL stage, animation runtime) lives inside each root layout,
 * so it persists across navigation within one locale.
 */
export function RootDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html lang={lang} className={jost.variable}>
      <body>
        <ExperienceRoot>{children}</ExperienceRoot>
      </body>
    </html>
  );
}
