import { DisplayName } from "@/components/branding/DisplayName";
import { TransitionLink } from "@/components/navigation/TransitionLink";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { localizedPath } from "@/i18n/routes";

/**
 * Home page structure only. Layout, the 3D hero scene (a <SceneAnchor> inside
 * the hero section), entrance and scroll animation are added in later steps;
 * the semantic order below is what they build on.
 */
export function HomePage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <main id="main" tabIndex={-1} className="px-4">
      <section aria-labelledby="home-hero-title" data-home-section="hero">
        <h1 id="home-hero-title" className="max-w-3xl">
          <DisplayName preload sizes="(min-width: 48rem) 48rem, 100vw" />
        </h1>
        {dict.home.intro ? <p>{dict.home.intro}</p> : null}
        <p>
          <TransitionLink
            href={localizedPath("projects", locale)}
            className="inline-flex min-h-11 items-center underline"
          >
            {dict.home.cta}
          </TransitionLink>
        </p>
      </section>
    </main>
  );
}
