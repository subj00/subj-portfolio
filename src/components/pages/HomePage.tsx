import { HeroSection } from "@/components/home/HeroSection";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

/** Home page. Only the hero exists for now; further sections are added in later steps. */
export function HomePage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <HeroSection locale={locale} dict={dict} />
    </main>
  );
}
