/**
 * Decides, before first paint, whether the cinematic hero intro plays.
 *
 * Rendered as an inline <script> in <head> (RootDocument), so the server HTML
 * never flashes the finished hero before going dark. It sets
 * `html[data-intro="play"]`; CSS (globals.css, "Hero intro") then hides the
 * hero content and shows the intro overlay, and HeroIntro takes over once
 * hydrated ("running" → attribute removed when done).
 *
 * Plays at most once per browsing session (sessionStorage: survives reloads
 * and Back/Forward in this tab, resets in a new tab), only on the home route
 * when landing at the top (not on a deep link such as /sr#projekti), and never
 * with reduced motion. Language switches and in-page navigation are client
 * side, so this script does not run again for them.
 *
 * Without JavaScript nothing is set and the hero renders as is. If the intro
 * never starts (script error, very slow hydration), a CSS fail-safe reveals
 * everything after INTRO_FAILSAFE_MS.
 */

export const INTRO_SESSION_KEY = "portfolio:intro";
export const INTRO_FAILSAFE_MS = 3500;

export const INTRO_GATE_SCRIPT = `(function(){try{
var h=location.hash.slice(1);
if(!/^\\/(sr|en)\\/?$/.test(location.pathname))return;
if(h&&h!=="pocetna"&&h!=="home")return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
if(sessionStorage.getItem("${INTRO_SESSION_KEY}"))return;
sessionStorage.setItem("${INTRO_SESSION_KEY}","1");
document.documentElement.setAttribute("data-intro","play");
}catch(e){}})();`;
