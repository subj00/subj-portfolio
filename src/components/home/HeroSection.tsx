import { DisplayName } from "@/components/branding/DisplayName";
import { PortfolioSection } from "@/components/layout/PortfolioSection";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { sectionId } from "@/i18n/sections";
import { HeroCta } from "./HeroCta";
import { HeroIntro } from "./HeroIntro";
import { HeroSceneSlot } from "./HeroSceneSlot";
import styles from "./HeroSection.module.css";
import { ScrollIndicator } from "./ScrollIndicator";

/**
 * Hero: the first section of the one-page portfolio (Server Component; only
 * the PortfolioSection wrapper is client-side, for activation tracking).
 * The intro (HeroIntro) animates the elements marked data-intro-el; scroll
 * motion attaches to this structure in a later step.
 */
export function HeroSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <PortfolioSection
      section="home"
      id={sectionId(locale, "home")}
      labelledBy="home-hero-title"
      className={styles.hero}
    >
      <HeroSceneSlot />
      <HeroIntro />

      <div className={styles.content}>
        <p data-intro-el="eyebrow" className={styles.eyebrow}>
          <span aria-hidden className={styles.index}>
            01
          </span>
          <span aria-hidden className={styles.rule} />
          <span>{dict.home.role}</span>
        </p>

        <h1 id="home-hero-title" data-intro-el="name" className={styles.name}>
          <DisplayName preload sizes="(width >= 48rem) and (orientation: landscape) 52vw, 92vw" />
          {/* Glowing edge that rides the intro's name wipe (shown only during it). */}
          <span data-intro-edge aria-hidden className={styles.introEdge} />
        </h1>

        {dict.home.intro ? (
          <p data-intro-el="intro" className={styles.intro}>
            {dict.home.intro}
          </p>
        ) : null}

        <div data-intro-el="cta" className={styles.cta}>
          <HeroCta locale={locale} section="projects" label={dict.home.cta} />
        </div>
      </div>

      <ScrollIndicator label={dict.home.scroll} />
    </PortfolioSection>
  );
}
