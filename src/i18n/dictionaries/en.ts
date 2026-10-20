import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    siteDescription: "Personal portfolio — frontend development and interactive web experiences.",
    pages: {
      home: {
        title: "Home",
        description: "Personal portfolio — frontend development and interactive web experiences.",
      },
      about: { title: "About me", description: "Who I am, what I do and how I work." },
      projects: { title: "Projects", description: "Selected projects and case studies." },
    },
  },
  nav: {
    label: "Main navigation",
    skipToContent: "Skip to content",
    pages: { home: "Home", about: "About me", projects: "Projects" },
  },
  language: {
    label: "Language",
  },
  home: {
    intro: "", // TODO: short introduction
    cta: "View projects",
  },
  placeholder: {
    inProgress: "This page is being built.",
  },
  notFound: {
    title: "Page not found",
    body: "The address you opened does not exist.",
    backHome: "Back to home",
  },
};
