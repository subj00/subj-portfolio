import { PortfolioSection } from "@/components/layout/PortfolioSection";
import { type Project, projects } from "@/content/projects";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { sectionId } from "@/i18n/sections";
import styles from "./ProjectsSection.module.css";

/**
 * Projects (section 03): a purely typographic presentation, no screenshots.
 *   wide   – label and large title with the supporting line beside it, then
 *            three tall bordered panels side by side
 *   mobile – the same panels stacked, full width
 * Each panel: number, category (+ context for professional work), large
 * title, description, and the external link (or "link coming soon" while the
 * URL is unknown). Content: src/content/projects.ts + dictionaries.
 *
 * data-projects marks the parts a later scroll transition will animate; the
 * CSS keeps transforms off them so GSAP can own them cleanly.
 */
export function ProjectsSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <PortfolioSection
      section="projects"
      id={sectionId(locale, "projects")}
      labelledBy="projects-title"
      className={styles.projects}
    >
      <header data-projects="heading" className={styles.heading}>
        <div>
          <p aria-hidden className={styles.index}>
            03
            <span className={styles.rule} />
            {dict.nav.sections.projects}
          </p>
          <h2 id="projects-title" className={styles.title}>
            {dict.nav.sections.projects}
          </h2>
        </div>
        <p className={styles.intro}>{dict.projects.intro}</p>
      </header>

      <ol className={styles.list}>
        {projects.map((project, index) => (
          <ProjectEntry key={project.id} project={project} index={index} dict={dict} />
        ))}
      </ol>
    </PortfolioSection>
  );
}

function ProjectEntry({
  project,
  index,
  dict,
}: {
  project: Project;
  index: number;
  dict: Dictionary;
}) {
  const text = dict.projects.items[project.id];
  const number = String(index + 1).padStart(2, "0");
  return (
    <li data-projects="entry" className={styles.entry}>
      <div className={styles.meta}>
        <span aria-hidden className={styles.number}>
          {number}
        </span>
        <p className={styles.category}>{text.category}</p>
      </div>

      <div className={styles.body}>
        <h3 className={styles.entryTitle}>{project.title}</h3>
        {text.context ? <p className={styles.context}>{text.context}</p> : null}
        <p className={styles.description}>{text.description}</p>
      </div>

      {project.url ? (
        <a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.action}>
          <span aria-hidden className={styles.ring}>
            <span className={styles.arrow} />
          </span>
          <span className={styles.actionLabel}>{dict.projects.visit}</span>
          <span className="sr-only">
            {" "}
            {project.title} {dict.projects.external}
          </span>
        </a>
      ) : (
        <p className={`${styles.action} ${styles.pending}`}>
          <span aria-hidden className={styles.ring}>
            <span className={styles.arrow} />
          </span>
          <span className={styles.actionLabel}>{dict.projects.soon}</span>
        </p>
      )}
    </li>
  );
}
