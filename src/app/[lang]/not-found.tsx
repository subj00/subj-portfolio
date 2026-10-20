import { TransitionLink } from "@/components/navigation/TransitionLink";
import { localizedPath } from "@/i18n/routes";
import { currentLocale, getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const locale = await currentLocale();
  const dict = getDictionary(locale);
  return (
    <main id="main" tabIndex={-1} className="px-4">
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
