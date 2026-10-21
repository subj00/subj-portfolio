/**
 * Projects shown in the Projects section, in display order. Language-neutral
 * data only; categories and descriptions live in the dictionaries
 * (`projects.items[id]`).
 *
 * `url`: the live website, or null while it is not verified yet (the entry
 * then shows a non-interactive "link coming soon" instead of a link).
 */

export const PROJECT_IDS = ["dajana", "hrana-bez-mana", "american-eagle"] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];

export interface Project {
  id: ProjectId;
  /** Shown as is in every language (proper names). A no-break space keeps " —"
      with the first part when the title wraps. */
  title: string;
  /** Independent work, or a contribution made as part of an employer's team. */
  kind: "independent" | "professional";
  url: string | null;
}

export const projects: readonly Project[] = [
  {
    id: "dajana",
    title: "Portfolio\u00a0- Dajana Subotić",
    kind: "independent",
    url: "https://dajana-portfolio.vercel.app/",
  },
  {
    id: "hrana-bez-mana",
    title: "Hrana bez mana\u00a0- Catering",
    kind: "independent",
    url: "https://hrana-bez-mana.vercel.app/",
  },
  {
    id: "american-eagle",
    title: "American Eagle Outfitters",
    kind: "professional",
    url: "https://www.ae.com/us/en",
  },
];
