import type { Dictionary } from "./types";

export const sr: Dictionary = {
  meta: {
    siteDescription: "Lični portfolio — frontend razvoj i interaktivna web iskustva.",
    pages: {
      home: {
        title: "Početna",
        description: "Lični portfolio — frontend razvoj i interaktivna web iskustva.",
      },
      about: { title: "O meni", description: "Ko sam, šta radim i kako radim." },
      projects: { title: "Projekti", description: "Izabrani projekti i studije slučaja." },
    },
  },
  nav: {
    label: "Glavna navigacija",
    skipToContent: "Preskoči na sadržaj",
    pages: { home: "Početna", about: "O meni", projects: "Projekti" },
  },
  language: {
    label: "Izbor jezika",
  },
  home: {
    intro: "", // TODO: kratak uvodni tekst
    cta: "Pogledaj projekte",
  },
  placeholder: {
    inProgress: "Ova stranica je u izradi.",
  },
  notFound: {
    title: "Stranica nije pronađena",
    body: "Adresa koju ste otvorili ne postoji.",
    backHome: "Nazad na početnu",
  },
};
