import { AboutSection } from "@/components/home/AboutSection";
import { HeroSection } from "@/components/home/HeroSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { RedFracture } from "@/components/home/RedFracture";
import { RedShift } from "@/components/home/RedShift";
import { SectionPlaceholder } from "@/components/home/SectionPlaceholder";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

/**
 * The portfolio: one continuous page whose sections (in scroll order) will
 * transform into one another through ScrollTrigger and the persistent WebGL
 * stage. Hero, About and Projects are designed; Contact is a placeholder.
 */
export function HomePage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const placeholder = (section: "contact") => (
    <SectionPlaceholder
      locale={locale}
      section={section}
      title={dict.nav.sections[section]}
      body={dict.placeholder.inProgress}
    />
  );

  return (
    // relative: the About → Projects energy overlay (RedFracture) is positioned in it.
    <main id="main" tabIndex={-1} className="relative outline-none">
      <HeroSection locale={locale} dict={dict} />
      <AboutSection locale={locale} dict={dict} />
      {/* Hero → About scroll transition (client; renders nothing visible). */}
      <RedShift />
      <ProjectsSection locale={locale} dict={dict} />
      {/* About → Projects transition and its energy overlay (client). */}
      <RedFracture />
      {placeholder("contact")}
    </main>
  );
}
