import { TransitionLink } from "@/components/navigation/TransitionLink";
import { site } from "@/content/site";
import { localizedPath } from "@/i18n/routes";
import { currentLocale, getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const locale = await currentLocale();
  const dict = getDictionary(locale);
  return (
    <main
      id="main"
      tabIndex={-1}
      className="px-[var(--gutter-l)] pt-[calc(var(--header-h)+env(safe-area-inset-top)+3rem)] outline-none"
    >
      {/* not-found has no metadata API; React hoists <title> into <head>. */}
      <title>{`${dict.notFound.title} — ${site.name}`}</title>
      <h1 className="text-2xl">{dict.notFound.title}</h1>
      <p className="mt-2">{dict.notFound.body}</p>
      <p className="mt-4">
        <TransitionLink href={localizedPath("home", locale)} className="underline">
          {dict.notFound.backHome}
        </TransitionLink>
      </p>
    </main>
  );
}
