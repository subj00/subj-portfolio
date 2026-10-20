import { DisplayName } from "@/components/branding/DisplayName";
import { PortfolioSection } from "@/components/layout/PortfolioSection";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { sectionId } from "@/i18n/sections";
import { HeroCta } from "./HeroCta";
import { HeroSceneSlot } from "./HeroSceneSlot";
import styles from "./HeroSection.module.css";
import { ScrollIndicator } from "./ScrollIndicator";

/**
 * Hero: the first section of the one-page portfolio (Server Component; only
 * the PortfolioSection wrapper is client-side, for activation tracking).
 * Static layout only: entrance animation, scroll motion and the 3D object
 * attach to this structure in later steps.
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

      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <span aria-hidden className={styles.index}>
            01
          </span>
          <span aria-hidden className={styles.rule} />
          <span>{dict.home.role}</span>
        </p>

        <h1 id="home-hero-title" className={styles.name}>
          <DisplayName preload sizes="(width >= 48rem) and (orientation: landscape) 52vw, 92vw" />
        </h1>

        {dict.home.intro ? <p className={styles.intro}>{dict.home.intro}</p> : null}

        <HeroCta locale={locale} section="projects" label={dict.home.cta} className={styles.cta} />
      </div>

      <ScrollIndicator label={dict.home.scroll} />
    </PortfolioSection>
  );
}
