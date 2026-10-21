import type { PageKey } from "../routes";
import type { SectionKey } from "../sections";

/** One education or work row of the About timeline. */
export interface TimelineEntry {
  kind: "education" | "work";
  /** Institution or company. */
  title: string;
  /** Degree / programme or role, one item per line. */
  subtitle: string[];
  /** As displayed, e.g. "2019 – 2023" or "2023 – danas". */
  period: string;
  /** Revealed by the row's disclosure; one item per line. */
  details: string[];
}

/**
 * Every visible UI string. Both locales implement this interface, so a missing
 * or misspelled key is a type error, not a blank UI.
 */
export interface Dictionary {
  meta: {
    /** Default description when a page has none of its own. */
    siteDescription: string;
    pages: Record<PageKey, { title: string; description: string }>;
  };
  nav: {
    /** Accessible name of the primary <nav>. */
    label: string;
    skipToContent: string;
    /** Section labels, also used as the section headings. */
    sections: Record<SectionKey, string>;
    menuOpen: string;
    menuClose: string;
  };
  language: {
    /** Accessible name of the language switcher. */
    label: string;
  };
  home: {
    /** Small uppercase label above the name. */
    role: string;
    /** Tagline under the name (one short line). */
    intro: string;
    cta: string;
    /** Visible text of the scroll indicator. */
    scroll: string;
  };
  about: {
    /** Heading in two lines; the second is set in the accent colour. */
    title: [string, string];
    /** Short personal introduction. */
    bio: string;
    /** Label of the CV download action. */
    cv: string;
    /** Screen-reader hint after the CV label, e.g. "(PDF)". */
    cvHint: string;
    /** Accessible name of the education/experience list. */
    timelineLabel: string;
    /** Rows in display order (education first, then experience). */
    timeline: TimelineEntry[];
  };
  placeholder: {
    inProgress: string;
  };
  notFound: {
    title: string;
    body: string;
    backHome: string;
  };
}
