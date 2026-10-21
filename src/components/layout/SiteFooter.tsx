import { cacheLife } from "next/cache";
import { DisplayName } from "@/components/branding/DisplayName";
import { SectionLink } from "@/components/navigation/SectionLink";
import { site } from "@/content/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { FooterReveal } from "./FooterReveal";
import styles from "./SiteFooter.module.css";

/**
 * The closing signature: a thin divider with a crimson accent, the name
 * graphic (smaller than the hero's) with the role beneath it, and a quiet
 * bottom row: copyright, a circular "back to top" control, the credit.
 *
 * Sits after <main> (the page's contentinfo landmark). The name is the same
 * image as the hero's, in a paragraph (the page's only h1 stays in the hero).
 * Back to top is a section link to Home: the shared scroller, URL hash,
 * history and focus handling, and reduced-motion jumps all come with it.
 * FooterReveal adds the one entrance animation; without it all is visible.
 */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className={styles.footer}>
      <span aria-hidden className={styles.divider} />

      <div className={styles.signature}>
        <p data-footer="name" className={styles.name}>
          <span data-footer="name-inner" className={styles.nameInner}>
            {/* sizes: the graphic renders at 107% of its box (optical trim). */}
            <DisplayName sizes="(width >= 48rem) 24vw, 70vw" />
          </span>
        </p>
        <p data-footer="role" className={styles.role}>
          {dict.home.role}
        </p>
      </div>

      <div data-footer="bottom" className={styles.bottom}>
        <p className={styles.meta}>
          © <CurrentYear /> {site.name}
        </p>
        <SectionLink
          locale={locale}
          section="home"
          aria-label={dict.footer.backToTop}
          className={styles.top}
        >
          <span aria-hidden className={styles.arrow} />
        </SectionLink>
        <p className={`${styles.meta} ${styles.credit}`}>{dict.footer.credit}</p>
      </div>

      <FooterReveal />
    </footer>
  );
}

/**
 * The current year. Cached (Cache Components forbids reading the clock while
 * prerendering) and refreshed daily, so it rolls over on its own.
 */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
