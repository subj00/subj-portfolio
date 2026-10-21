import { AboutSection } from "@/components/home/AboutSection";
import { HeroSection } from "@/components/home/HeroSection";
import { RedShift } from "@/components/home/RedShift";
import { SectionPlaceholder } from "@/components/home/SectionPlaceholder";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

/**
 * The portfolio: one continuous page whose sections (in scroll order) will
 * transform into one another through ScrollTrigger and the persistent WebGL
 * stage. Hero and About are designed; the others are placeholders.
 */
export function HomePage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const placeholder = (section: "projects" | "contact") => (
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
      <AboutSection locale={locale} dict={dict} />
      {/* Hero → About scroll transition (client; renders nothing visible). */}
      <RedShift />
      {placeholder("projects")}
      {placeholder("contact")}
    </main>
  );
}
