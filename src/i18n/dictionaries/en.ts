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
        description:
          "A modern, well-structured portfolio website that showcases professional experience and work in digital marketing through minimalist design, clear navigation, and thoughtfully organized content.",
      },
      "hrana-bez-mana": {
        category: "Client project",
        description:
          "A modern, visually playful website with a design tailored to the products it showcases, focusing on an engaging presentation, clear content structure, and an intuitive user experience.",
      },
      "american-eagle": {
        category: "Professional experience",
        description:
          "Development, maintenance, and improvement of the American Eagle Outfitters e-commerce platform as part of the Grid Dynamics team, focusing on system quality, stability, and functionality.",
      },
    },
  },
  footer: {
    credit: "Designed & built by me",
    backToTop: "Back to top",
  },
  contact: {
    title: ["Let's work", "together."],
    intro: "Have an idea, a project, or a collaboration in mind? I'd love to hear about it.",
    closing: "Looking forward to working together",
    external: "(opens in a new tab)",
    email: { label: "Email", short: "Send an email" },
    linkedin: { label: "LinkedIn", text: "Let's connect on LinkedIn", short: "LinkedIn profile" },
    phone: { label: "Phone" },
    location: { label: "Location", text: "Belgrade, Serbia" },
  },
  notFound: {
    title: "Page not found",
    body: "The address you opened does not exist.",
    backHome: "Back to home",
  },
};
