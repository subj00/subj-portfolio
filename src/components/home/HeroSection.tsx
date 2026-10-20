import { DisplayName } from "@/components/branding/DisplayName";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { localizedPath } from "@/i18n/routes";
import { HeroCta } from "./HeroCta";
import { HeroSceneSlot } from "./HeroSceneSlot";
import styles from "./HeroSection.module.css";
import { ScrollIndicator } from "./ScrollIndicator";

/**
 * Home hero (Server Component). Static layout only: entrance animation,
 * scroll motion and the 3D object attach to this structure in later steps.
 */
export function HeroSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section aria-labelledby="home-hero-title" data-home-section="hero" className={styles.hero}>
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

        <HeroCta
          href={localizedPath("projects", locale)}
          label={dict.home.cta}
          className={styles.cta}
        />
      </div>

      <ScrollIndicator label={dict.home.scroll} />
    </section>
  );
}
