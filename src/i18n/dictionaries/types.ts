import type { PageKey } from "../routes";
import type { SectionKey } from "../sections";

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
  placeholder: {
    inProgress: string;
  };
  notFound: {
    title: string;
    body: string;
    backHome: string;
  };
}
