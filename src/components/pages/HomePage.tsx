import { HeroSection } from "@/components/home/HeroSection";
import { SectionPlaceholder } from "@/components/home/SectionPlaceholder";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

/**
 * The portfolio: one continuous page whose sections (in scroll order) will
 * transform into one another through ScrollTrigger and the persistent WebGL
 * stage. Only the hero is designed so far; the others are placeholders.
 */
export function HomePage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const placeholder = (section: "about" | "projects" | "contact") => (
    <SectionPlaceholder
      locale={locale}
      section={section}
      title={dict.nav.sections[section]}
      body={dict.placeholder.inProgress}
    />
  );

  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <HeroSection locale={locale} dict={dict} />
      {placeholder("about")}
      {placeholder("projects")}
      {placeholder("contact")}
    </main>
  );
}
