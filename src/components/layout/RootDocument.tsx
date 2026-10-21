import { Jost, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { INTRO_GATE_SCRIPT } from "@/animation/intro-gate";
import { ExperienceRoot } from "@/runtime/ExperienceRoot";
import "@/styles/globals.css";

// Geometric sans for labels, navigation and body copy. Self-hosted by next/font
// at build time (no runtime request to Google); latin-ext covers č ć š ž đ.
const jost = Jost({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jost",
  display: "swap",
});

// Editorial sans for the hero tagline: a light, slightly technical grotesk that
// contrasts with the high-contrast display lettering of the name.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/**
 * <html>/<body> shell shared by every root layout ([lang] and the lab group).
 * ExperienceRoot (WebGL stage, animation runtime) lives inside each root layout,
 * so it persists across navigation within one locale.
 */
export function RootDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    // suppressHydrationWarning: the intro gate and the runtime set data-* attributes
    // on <html> before React hydrates.
    <html
      lang={lang}
      className={`${jost.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* First in <body>, so it runs before anything is painted: decides whether the
            hero intro plays (intro-gate.ts). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
        <ExperienceRoot>{children}</ExperienceRoot>
      </body>
    </html>
  );
}
