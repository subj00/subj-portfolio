import type { PageKey } from "../routes";

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
    pages: Record<PageKey, string>;
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
    /** Short introduction under the name. */
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
