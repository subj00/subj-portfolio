import Image from "next/image";
import { PortfolioSection } from "@/components/layout/PortfolioSection";
import { site } from "@/content/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary, TimelineEntry } from "@/i18n/dictionaries/types";
import { sectionId } from "@/i18n/sections";
import jobIcon from "../../../public/images/icons/job-icon.png";
import universityIcon from "../../../public/images/icons/university-icon.png";
import portrait from "../../../public/images/profile/profile-photo.png";
import styles from "./AboutSection.module.css";

/** The CV in public/documents. */
const CV_PATH = "/documents/Jelena-Subotic-CV.pdf";
const CV_FILE_NAME = "Jelena-Subotic-CV.pdf";

const ICONS = { education: universityIcon, work: jobIcon } as const;

/**
 * About (section 02), reproducing the reference layout:
 *   wide   – heading, opening statement, introduction and CV action |
 *            editorial portrait that emerges from the darkness (masked edges;
 *            its red light is part of the photo) | timeline
 *   mobile – a large, full-bleed portrait whose base dissolves into the
 *            heading, then statement, introduction, CV action, timeline
 * The timeline is static and fully visible (work, then degrees): icons, a red
 * rail with dots, thin separators and dates. Server component, no JavaScript.
 */
export function AboutSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const about = dict.about;
  return (
    <PortfolioSection
      section="about"
      id={sectionId(locale, "about")}
      labelledBy="about-title"
      className={styles.about}
    >
      <svg aria-hidden className={styles.arcs} viewBox="0 0 1230 456" preserveAspectRatio="none">
        <path d="M352 112 C 300 230, 350 380, 470 456" />
        <path d="M690 360 C 760 420, 820 440, 905 456" />
      </svg>

      <div className={styles.intro}>
        <p aria-hidden className={styles.index}>
          02
          <span className={styles.rule} />
        </p>
        <h2 id="about-title" className={styles.title}>
          <span>{about.title[0]}</span> <span className={styles.accent}>{about.title[1]}</span>
        </h2>
        <p className={styles.lead}>{about.lead}</p>
        <p className={styles.bio}>{about.bio}</p>
        <a href={CV_PATH} download={CV_FILE_NAME} type="application/pdf" className={styles.cv}>
          <span aria-hidden className={styles.ring}>
            <span className={styles.dot} />
          </span>
          <span className={styles.cvLabel}>{about.cv}</span>
          <span className="sr-only"> {about.cvHint}</span>
        </a>
      </div>

      <figure className={styles.portrait}>
        <Image
          src={portrait}
          alt={site.name}
          sizes="(width >= 48rem) and (orientation: landscape) 25vw, 100vw"
          className={styles.photo}
        />
      </figure>

      <ol aria-label={about.timelineLabel} className={styles.timeline}>
        {about.timeline.map((entry) => (
          <TimelineRow key={entry.title} entry={entry} />
        ))}
      </ol>
    </PortfolioSection>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  return (
    <li className={styles.entry}>
      <Image src={ICONS[entry.kind]} alt="" sizes="2rem" className={styles.icon} />
      <span aria-hidden className={styles.node} />
      <div className={styles.head}>
        <h3 className={styles.entryTitle}>{entry.title}</h3>
        {entry.lines.map((line) => (
          <p key={line} className={styles.entryLine}>
            {line}
          </p>
        ))}
        {entry.note ? <p className={styles.entryNote}>{entry.note}</p> : null}
      </div>
      <p className={styles.period}>{entry.period}</p>
    </li>
  );
}
