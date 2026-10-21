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
    bio: "I am creative and curious, and I love programming and building websites, turning ideas into something concrete. I enjoy learning, exploring, travelling and meeting new people and cultures.",
    cv: "Download CV",
    cvHint: "(PDF)",
    timelineLabel: "Education and experience",
    timeline: [
      {
        kind: "education",
        title: "University of Belgrade – FON",
        subtitle: ["Bachelor's degree", "Information Systems and Technologies"],
        period: "2019 – 2023",
        details: [
          "Faculty of Organizational Sciences, University of Belgrade.",
          "Study programme: Information Systems and Technologies.",
        ],
      },
      {
        kind: "education",
        title: "Master's degree",
        subtitle: [
          "Faculty of Organizational Sciences",
          "Information Technology and Cybersecurity",
        ],
        period: "2023 – 2024",
        details: [
          "Title: Master of Information Systems Engineering.",
          "Study programme: Information Technology and Cybersecurity.",
        ],
      },
      {
        kind: "work",
        title: "Grid Dynamics, Belgrade",
        subtitle: ["Medior Software Engineer"],
        period: "2023 – Present",
        details: [
          "Developing and maintaining an e-commerce platform for American Eagle.",
          "Implementing new features and improving existing ones.",
          "Fixing bugs, QA and regression testing, with a focus on stability and performance.",
          "Taking part in code reviews and working with development and QA teams.",
        ],
      },
    ],
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
