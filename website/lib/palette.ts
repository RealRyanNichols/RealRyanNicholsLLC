// Brand colors that CSS cannot reach.
//
// Everything the browser renders uses the CSS custom properties defined in
// styles/tokens.css (imported by app/globals.css). This module mirrors those
// values for the places where a CSS variable cannot resolve: Satori OG cards
// (app/og/*), the sharp-rendered profile SVG (app/api/j6/profile-image), and
// any code that must hand a literal color to a non-DOM renderer.
//
// The rule: no hex literal for these colors inside app/ or components/.
// tests/palette.test.ts fails if this file and styles/tokens.css disagree.
export const PALETTE = {
  // Live / "online" green used for pulse dots, radar pings, healthy chips.
  live: "#7fe3a9",
  // Gold as it reads on navy surfaces (headers, situation room, OG cards).
  goldBright: "#e1bd5b",
  // Lighter gold for secondary chart series and "watch" states.
  goldLight: "#e4c66a",
  // Deep green line for unique visitors on the visitor trend chart.
  greenDeep: "#2f7d54",
  // Sky blue for search-crawler series.
  sky: "#38bdf8",
  // Amber for "watch" tones and capped-sample strips.
  amber: "#b45309",
  // Third-party brand colors, used only to color their traffic sources.
  brandFacebook: "#4267B2",
  brandGoogle: "#34a853",
  brandInstagram: "#E1306C",
} as const;

export type PaletteKey = keyof typeof PALETTE;

// CSS custom property name for each palette entry. Use `var(${CSS_TOKEN.x})`
// in class names and SVG attributes; use PALETTE.x only where CSS is absent.
export const CSS_TOKEN: Record<PaletteKey, `--color-${string}`> = {
  live: "--color-live",
  goldBright: "--color-gold-bright",
  goldLight: "--color-gold-light",
  greenDeep: "--color-green-deep",
  sky: "--color-sky",
  amber: "--color-amber",
  brandFacebook: "--color-brand-facebook",
  brandGoogle: "--color-brand-google",
  brandInstagram: "--color-brand-instagram",
};
