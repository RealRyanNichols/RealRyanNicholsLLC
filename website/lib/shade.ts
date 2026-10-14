// The color-shade test. Ryan, October 2026: "maybe it's got too dark of a
// color ... test out different shades." Two arms split visitors 50/50:
//
//   theater  the current deep navy room (control)
//   dusk     the same room with the lights up: a lifted navy floor and
//            brighter secondary type
//
// A light (paper) arm is not here yet: the homepage title card, the chat
// launcher and the top strip still paint navy-on-navy on a light floor. Each
// needs its own pass before a light shade can join the draw.
//
// The assignment lives in a first-party cookie, set by an inline script in
// <head> before first paint (app/layout.tsx), so pages stay static and no
// visitor sees a flash of the wrong shade. Colors are CSS token overrides on
// html[data-shade] in app/globals.css. components/ShadeExposure.tsx logs one
// `shade_exposure` event per session; /admin/shade-test reads the results.
//
// Preview either arm: /?shade=dusk, /?shade=theater.
// Back into the random draw: /?shade=reset.

export const SHADE_COOKIE = "rrn_shade";

/** Arms visitors are randomly assigned to, equal weight. */
export const SHADE_ARMS = ["theater", "dusk"] as const;

/** Every shade the site can render. A preview-only shade would be listed
 *  here and left out of SHADE_ARMS. */
export const SHADES = ["theater", "dusk"] as const;

export type Shade = (typeof SHADES)[number];

export const SHADE_LABELS: Record<Shade, string> = {
  theater: "Theater (current deep navy)",
  dusk: "Dusk (lifted navy, brighter type)",
};

export function isShade(value: unknown): value is Shade {
  return typeof value === "string" && (SHADES as readonly string[]).includes(value);
}

// 90 days: long enough that a returning visitor keeps the same shade for the
// life of the test.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/**
 * Runs inline in <head>. Plain ES5, no imports, wrapped in try/catch so a
 * locked-down browser just gets the default theater shade. The arms are
 * inlined from the constants above so the script and the report never drift.
 */
export const SHADE_BOOT_SCRIPT = `(function(){try{
var known=${JSON.stringify(SHADES)},arms=${JSON.stringify(SHADE_ARMS)};
var m=document.cookie.match(/(?:^|; )${SHADE_COOKIE}=([a-z]+)/);
var s=m&&known.indexOf(m[1])>-1?m[1]:null;
var q=new URLSearchParams(location.search).get("shade");
if(q==="reset"){s=null;}else if(q&&known.indexOf(q)>-1){s=q;}
if(!s){s=arms[Math.floor(Math.random()*arms.length)];}
document.cookie="${SHADE_COOKIE}="+s+"; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax";
document.documentElement.setAttribute("data-shade",s);
}catch(e){}})();`;
