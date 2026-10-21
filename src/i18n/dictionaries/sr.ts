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
    intro: "Kod koji pomera granice.",
    cta: "Pogledaj projekte",
    scroll: "Skroluj",
  },
  about: {
    title: ["O", "meni"],
    lead: "Radoznalost me pokreće. Kreativnost me zadržava.",
    bio: "Volim da istražujem ideje i pretvaram ih u digitalna iskustva. Inspiraciju pronalazim i van ekrana — na putovanjima, u novim mestima, kulturama i razgovorima koji otvaraju drugačije perspektive.",
    cv: "Preuzmi CV",
    cvHint: "(PDF)",
    timelineLabel: "Obrazovanje i iskustvo",
    timeline: [
      {
        kind: "work",
        title: "Grid Dynamics d.o.o., Beograd",
        lines: ["Medior Software Engineer"],
        note: "Prethodno: Junior Software Engineer (2023\u2060–\u20602026)",
        period: "2026–danas",
      },
      {
        kind: "education",
        title: "Fakultet organizacionih nauka, master studije",
        lines: ["Univerzitet u Beogradu", "Informacione tehnologije i sajber bezbednost"],
        period: "2023–2024",
      },
      {
        kind: "education",
        title: "Fakultet organizacionih nauka, osnovne studije",
        lines: ["Univerzitet u Beogradu", "Informacioni sistemi i tehnologije"],
        period: "2019–2023",
      },
    ],
  },
  projects: {
    intro: "Od samostalnih ideja do profesionalnih projekata.",
    visit: "Poseti sajt",
    external: "(otvara se u novoj kartici)",
    soon: "Link uskoro",
    items: {
      dajana: {
        category: "Klijentski projekat",
        description: "Opis projekta će biti naknadno ažuriran.",
      },
      "hrana-bez-mana": {
        category: "Klijentski projekat",
        description: "Opis projekta će biti naknadno ažuriran.",
      },
      "american-eagle": {
        category: "Profesionalni angažman",
        context: "Kao deo tima u kompaniji Grid Dynamics",
        linkNote: "Javni sajt klijenta",
        description: "Opis profesionalnog angažmana biće naknadno ažuriran.",
      },
    },
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
