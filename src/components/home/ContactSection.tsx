import Image, { type StaticImageData } from "next/image";
import { PortfolioSection } from "@/components/layout/PortfolioSection";
import { contact } from "@/content/contact";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { sectionId } from "@/i18n/sections";
import linkedinIcon from "../../../public/images/icons/linkedin-icon.png";
import locationIcon from "../../../public/images/icons/location-icon.png";
import mailIcon from "../../../public/images/icons/mail-icon.png";
import phoneIcon from "../../../public/images/icons/phone-icon.png";
import styles from "./ContactSection.module.css";

/**
 * Contact (section 04), the closing scene:
 *   wide   – label, two-line heading, introduction, a 2×2 grid of contact
 *            panels and the closing statement on the left; a crimson orbital
 *            composition (SVG) with red light on the right
 *   mobile – stacked panels; a lighter orbital composition behind the top
 * Email, phone and LinkedIn are links (arrow shown); the location panel is
 * informational only (no arrow, not focusable). Content:
 * src/content/contact.ts + dictionaries.
 *
 * data-contact / data-orbit mark what the Projects → Contact transition
 * (FinalOrbit) animates (no CSS transforms on them).
 */
export function ContactSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.contact;
  return (
    <PortfolioSection
      section="contact"
      id={sectionId(locale, "contact")}
      labelledBy="contact-title"
      className={styles.contact}
    >
      <Orbits />

      <div data-contact="content" className={styles.content}>
        <p aria-hidden data-contact="part" className={styles.index}>
          04
          <span className={styles.rule} />
          {dict.nav.sections.contact}
        </p>
        <h2 id="contact-title" className={styles.title}>
          <span data-contact="title-line">{t.title[0]}</span>{" "}
          <span data-contact="title-line" className={styles.accent}>
            {t.title[1]}
          </span>
        </h2>
        <p data-contact="part" className={styles.intro}>
          {t.intro}
        </p>

        <ul className={styles.grid}>
          <ContactItem
            icon={mailIcon}
            label={t.email.label}
            value={contact.email}
            short={t.email.short}
            href={`mailto:${contact.email}`}
          />
          <ContactItem
            icon={linkedinIcon}
            label={t.linkedin.label}
            value={t.linkedin.text}
            short={t.linkedin.short}
            href={contact.linkedin}
            external={t.external}
          />
          <ContactItem
            icon={phoneIcon}
            label={t.phone.label}
            value={contact.phone.display}
            nowrap
            href={`tel:${contact.phone.tel}`}
          />
          <ContactItem
            icon={locationIcon}
            label={t.location.label}
            value={t.location.text}
            ringed
          />
        </ul>

        <p data-contact="closing" className={styles.closing}>
          <span aria-hidden className={styles.closingRing}>
            <span className={styles.arrow} />
          </span>
          <span className={styles.closingText}>{t.closing}</span>
          <span aria-hidden className={styles.closingLine} />
        </p>
      </div>
    </PortfolioSection>
  );
}

function ContactItem({
  icon,
  label,
  value,
  short,
  href,
  external,
  ringed = false,
  nowrap = false,
}: {
  icon: StaticImageData;
  label: string;
  value: string;
  /** Mobile wording (one line); `value` is shown on wide screens. */
  short?: string;
  /** Present for actionable items only. */
  href?: string;
  /** Screen-reader hint for links that open a new tab. */
  external?: string;
  /** The PNG has no circle of its own (location): draw one to match the others. */
  ringed?: boolean;
  /** Keep the value on one line (phone number). */
  nowrap?: boolean;
}) {
  const body = (
    <>
      <span aria-hidden className={`${styles.icon} ${ringed ? styles.iconRinged : ""}`}>
        <Image src={icon} alt="" sizes="4rem" className={styles.iconImage} />
      </span>
      <span className={styles.text}>
        {/* The space keeps label and value apart in the link's accessible name. */}
        <span className={styles.label}>{label}</span>{" "}
        <span className={`${styles.value} ${nowrap ? styles.nowrap : ""}`}>
          {short ? (
            <>
              <span className={styles.long}>{value}</span>
              <span className={styles.short}>{short}</span>
            </>
          ) : (
            value
          )}
        </span>
      </span>
    </>
  );
  return (
    <li data-contact="item" className={styles.item}>
      {href ? (
        <a
          href={href}
          className={styles.panel}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {body}
          {external ? <span className="sr-only"> {external}</span> : null}
          <span aria-hidden className={styles.go}>
            <span className={styles.arrow} />
          </span>
        </a>
      ) : (
        <div className={styles.panel}>{body}</div>
      )}
    </li>
  );
}

/**
 * Crimson orbits: thin ellipses at different intensities (one dotted), a few
 * glowing points and a ring marker. Decorative. Authored in a fixed 900×900
 * space anchored to the section's right edge, so the curves keep their shape
 * at any width. Each orbit and point is a marked group for later GSAP control.
 */
function Orbits() {
  return (
    <div aria-hidden data-contact="orbits" className={styles.orbits}>
      <svg viewBox="0 0 900 900" preserveAspectRatio="xMaxYMid slice" className={styles.orbitSvg}>
        <g fill="none" strokeLinecap="round">
          <g data-orbit="outer" transform="rotate(-22 700 470)">
            <ellipse
              cx="700"
              cy="470"
              rx="560"
              ry="300"
              stroke="rgb(227 18 27 / 0.32)"
              strokeWidth="1"
            />
          </g>
          <g data-orbit="dotted" transform="rotate(-30 760 520)">
            <ellipse
              cx="760"
              cy="520"
              rx="430"
              ry="210"
              stroke="rgb(255 48 56 / 0.55)"
              strokeWidth="1.6"
              strokeDasharray="0.1 9"
            />
          </g>
          <g data-orbit="bright" transform="rotate(-28 800 560)">
            {/* Glow under core: a cheap luminous line. */}
            <ellipse
              cx="800"
              cy="560"
              rx="380"
              ry="190"
              stroke="rgb(255 30 40 / 0.14)"
              strokeWidth="7"
            />
            <ellipse
              cx="800"
              cy="560"
              rx="380"
              ry="190"
              stroke="rgb(255 48 56 / 0.9)"
              strokeWidth="1.3"
            />
          </g>
          <g data-orbit="inner" transform="rotate(-34 840 600)">
            <ellipse
              cx="840"
              cy="600"
              rx="300"
              ry="150"
              stroke="rgb(227 18 27 / 0.45)"
              strokeWidth="1"
            />
          </g>
        </g>
        <g fill="rgb(255 48 56)">
          <g data-orbit-point="a">
            <circle cx="236" cy="482" r="11" opacity="0.18" />
            <circle cx="236" cy="482" r="3.5" />
          </g>
          <g data-orbit-point="b">
            <circle cx="566" cy="652" r="12" opacity="0.2" />
            <circle cx="566" cy="652" r="4" />
          </g>
          <g data-orbit-point="marker">
            <circle
              cx="452"
              cy="196"
              r="14"
              fill="none"
              stroke="rgb(255 48 56 / 0.55)"
              strokeWidth="1"
            />
            <circle cx="452" cy="196" r="2.5" fill="rgb(255 210 210)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
