import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    siteDescription: "Personal portfolio — frontend development and interactive web experiences.",
    pages: {
      home: {
        title: "Home",
        description:
          "Building modern web experiences through clean code, interaction, and thoughtful design.",
      },
      about: { title: "About me", description: "Who I am, what I do and how I work." },
      projects: { title: "Projects", description: "Selected projects and case studies." },
    },
  },
  nav: {
    label: "Main navigation",
    skipToContent: "Skip to content",
    pages: { home: "Home", about: "About me", projects: "Projects" },
    menuOpen: "Open menu",
    menuClose: "Close menu",
  },
  language: {
    label: "Language",
  },
  home: {
    role: "Frontend developer",
    intro:
      "Building modern web experiences through clean code, interaction, and thoughtful design.",
    cta: "View my work",
    scroll: "Scroll",
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
