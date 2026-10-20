import { describe, expect, it } from "vitest";
import { isLocale, LOCALES } from "./config";
import { en } from "./dictionaries/en";
import { sr } from "./dictionaries/sr";
import { pageMetadata } from "./metadata";
import { matchRoute, PAGE_KEYS, ROUTES } from "./routes";
import { isSectionKey, SECTION_IDS, SECTION_KEYS, sectionFromId, sectionHref } from "./sections";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
}

describe("routes", () => {
  it("prefixes every path with its locale and keeps paths unique", () => {
    const all = PAGE_KEYS.flatMap((p) => LOCALES.map((l) => ROUTES[p][l]));
    expect(new Set(all).size).toBe(all.length);
    for (const p of PAGE_KEYS) {
      for (const l of LOCALES) expect(ROUTES[p][l].split("/")[1]).toBe(l);
    }
  });

  it("maps a pathname back to its page and locale", () => {
    expect(matchRoute("/sr")).toEqual({ page: "home", locale: "sr" });
    expect(matchRoute("/en/")).toEqual({ page: "home", locale: "en" });
    expect(matchRoute("/en/o-meni")).toBeNull();
    expect(matchRoute("/lab")).toBeNull();
  });

  it("recognizes only configured locales", () => {
    expect(isLocale("sr")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

describe("sections", () => {
  it("builds localized in-page hrefs", () => {
    expect(sectionHref("sr", "about")).toBe("/sr#o-meni");
    expect(sectionHref("en", "about")).toBe("/en#about");
  });

  it("uses unique, URL-safe anchor ids within each locale", () => {
    for (const l of LOCALES) {
      const ids = SECTION_KEYS.map((k) => SECTION_IDS[l][k]);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("maps anchors back to section keys, per locale", () => {
    expect(sectionFromId("sr", "kontakt")).toBe("contact");
    expect(sectionFromId("en", "kontakt")).toBeNull();
    expect(isSectionKey("projects")).toBe(true);
    expect(isSectionKey("sync")).toBe(false);
    expect(isSectionKey(null)).toBe(false);
  });
});

describe("dictionaries", () => {
  it("have identical key structures", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(sr).sort());
  });

  it("label every section", () => {
    for (const k of SECTION_KEYS) {
      expect(sr.nav.sections[k]).toBeTruthy();
      expect(en.nav.sections[k]).toBeTruthy();
    }
  });
});

describe("pageMetadata", () => {
  it("emits canonical, hreflang alternates and x-default", () => {
    const meta = pageMetadata("home", "en", en);
    expect(meta.alternates?.canonical).toBe("/en");
    expect(meta.alternates?.languages).toEqual({ "x-default": "/sr", "sr-Latn": "/sr", en: "/en" });
  });
});
