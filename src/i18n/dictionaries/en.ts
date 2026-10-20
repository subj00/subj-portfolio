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
    },
  },
  nav: {
    label: "Main navigation",
    skipToContent: "Skip to content",
    sections: { home: "Home", about: "About me", projects: "Projects", contact: "Contact" },
    menuOpen: "Open menu",
    menuClose: "Close menu",
  },
  language: {
    label: "Language",
  },
  home: {
    role: "Frontend developer",
    intro: "Code beyond boundaries.",
    cta: "View my work",
    scroll: "Scroll",
  },
  placeholder: {
    inProgress: "This section is being built.",
  },
  notFound: {
    title: "Page not found",
    body: "The address you opened does not exist.",
    backHome: "Back to home",
  },
};
