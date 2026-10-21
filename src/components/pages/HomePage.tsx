import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { HeroSection } from "@/components/home/HeroSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { RedFracture } from "@/components/home/RedFracture";
import { RedShift } from "@/components/home/RedShift";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

/**
 * The portfolio: one continuous page whose sections (in scroll order) will
 * transform into one another through ScrollTrigger and the persistent WebGL
 * stage: Hero, About, Projects, Contact.
 */
export function HomePage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
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
      <ContactSection locale={locale} dict={dict} />
    </main>
  );
}
