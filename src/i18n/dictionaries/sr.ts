import type { Dictionary } from "./types";

export const sr: Dictionary = {
  meta: {
    siteDescription: "Lični portfolio — frontend razvoj i interaktivna web iskustva.",
    pages: {
      home: {
        title: "Početna",
        description:
          "Razvijam savremena web iskustva kroz čist kod, interakciju i promišljen dizajn.",
      },
    },
  },
  nav: {
    label: "Glavna navigacija",
    skipToContent: "Preskoči na sadržaj",
    sections: { home: "Početna", about: "O meni", projects: "Projekti", contact: "Kontakt" },
    menuOpen: "Otvori meni",
    menuClose: "Zatvori meni",
  },
  language: {
    label: "Izbor jezika",
  },
  home: {
    role: "Frontend developer",
    intro: "Razvijam savremena web iskustva kroz čist kod, interakciju i promišljen dizajn.",
    cta: "Pogledaj projekte",
    scroll: "Skroluj",
  },
  placeholder: {
    inProgress: "Ova sekcija je u izradi.",
  },
  notFound: {
    title: "Stranica nije pronađena",
    body: "Adresa koju ste otvorili ne postoji.",
    backHome: "Nazad na početnu",
  },
};
