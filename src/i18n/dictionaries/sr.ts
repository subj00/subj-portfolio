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
    bio: "Kreativna sam, radoznala i uživam u programiranju i izradi web stranica, kao i u pretvaranju ideja u nešto konkretno. Volim da učim, istražujem, putujem i upoznajem nove ljude i kulture.",
    cv: "Preuzmi CV",
    cvHint: "(PDF)",
    timelineLabel: "Obrazovanje i iskustvo",
    timeline: [
      {
        kind: "education",
        title: "Univerzitet u Beogradu – FON",
        subtitle: ["Osnovne akademske studije", "Informacioni sistemi i tehnologije"],
        period: "2019 – 2023",
        details: [
          "Fakultet organizacionih nauka, Univerzitet u Beogradu.",
          "Studijski program: Informacioni sistemi i tehnologije.",
        ],
      },
      {
        kind: "education",
        title: "Master studije",
        subtitle: ["Fakultet organizacionih nauka", "Informacione tehnologije i sajber bezbednost"],
        period: "2023 – 2024",
        details: [
          "Zvanje: master inženjer informacionih sistema.",
          "Studijski program: Informacione tehnologije i sajber bezbednost.",
        ],
      },
      {
        kind: "work",
        title: "Grid Dynamics doo, Beograd",
        subtitle: ["Medior Software Engineer"],
        period: "2023 – danas",
        details: [
          "Razvoj i održavanje e-commerce platforme za klijenta American Eagle.",
          "Implementacija novih funkcionalnosti i unapređenje postojećih.",
          "Otklanjanje bugova, QA i regresiono testiranje, uz fokus na stabilnost i performanse.",
          "Učešće u code review procesu i saradnja sa development i QA timovima.",
        ],
      },
    ],
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
