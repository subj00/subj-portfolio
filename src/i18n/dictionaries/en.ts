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
  about: {
    title: ["About", "me"],
    lead: "Driven by curiosity. Inspired by creativity.",
    bio: "I enjoy exploring ideas and turning them into digital experiences. Beyond the screen, I find inspiration in travel, new places, cultures, and conversations that open up different perspectives.",
    cv: "Download CV",
    cvHint: "(PDF)",
    timelineLabel: "Education and experience",
    timeline: [
      {
        kind: "work",
        title: "Grid Dynamics d.o.o., Belgrade",
        lines: ["Medior Software Engineer"],
        note: "Previously: Junior Software Engineer (2023\u2060–\u20602026)",
        period: "2026–Present",
      },
      {
        kind: "education",
        title: "Faculty of Organizational Sciences, Master's studies",
        lines: ["University of Belgrade", "Information Technology and Cybersecurity"],
        period: "2023–2024",
      },
      {
        kind: "education",
        title: "Faculty of Organizational Sciences, Bachelor's studies",
        lines: ["University of Belgrade", "Information Systems and Technologies"],
        period: "2019–2023",
      },
    ],
  },
  projects: {
    intro: "From independent ideas to professional projects.",
    visit: "Visit website",
    external: "(opens in a new tab)",
    soon: "Link coming soon",
    items: {
      dajana: {
        category: "Client project",
        description: "Project description will be updated.",
      },
      "hrana-bez-mana": {
        category: "Client project",
        description: "Project description will be updated.",
      },
      "american-eagle": {
        category: "Professional experience",
        context: "As part of the team at Grid Dynamics",
        linkNote: "Public client website",
        description: "Professional contribution details will be updated.",
      },
    },
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
