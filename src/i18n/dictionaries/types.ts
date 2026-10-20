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
  };
  language: {
    /** Accessible name of the language switcher. */
    label: string;
  };
  home: {
    /** Short introduction under the name. Empty until the copy is written. */
    intro: string;
    cta: string;
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
