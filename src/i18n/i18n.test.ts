import { describe, expect, it } from "vitest";
import { isLocale, LOCALES } from "./config";
import { en } from "./dictionaries/en";
import { sr } from "./dictionaries/sr";
import { pageMetadata } from "./metadata";
import { matchRoute, PAGE_KEYS, ROUTES } from "./routes";

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
    expect(matchRoute("/sr/o-meni")).toEqual({ page: "about", locale: "sr" });
    expect(matchRoute("/en/projects/")).toEqual({ page: "projects", locale: "en" });
    expect(matchRoute("/en")).toEqual({ page: "home", locale: "en" });
    expect(matchRoute("/en/o-meni")).toBeNull();
    expect(matchRoute("/lab")).toBeNull();
  });

  it("recognizes only configured locales", () => {
    expect(isLocale("sr")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

describe("dictionaries", () => {
  it("have identical key structures", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(sr).sort());
  });
});

describe("pageMetadata", () => {
  it("emits canonical, hreflang alternates and x-default", () => {
    const meta = pageMetadata("about", "en", en);
    expect(meta.alternates?.canonical).toBe("/en/about");
    expect(meta.alternates?.languages).toEqual({
      "x-default": "/sr/o-meni",
      "sr-Latn": "/sr/o-meni",
      en: "/en/about",
    });
  });
});
