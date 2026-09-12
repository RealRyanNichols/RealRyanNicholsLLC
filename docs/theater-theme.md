# The theater, site-wide

Ryan, September 8, 2026, on seeing the rebuilt `/the-story`: "I want the whole
site themed like that." This is the spec every page and component is migrated
against. It is written so a coding agent can apply it to one file without
having seen the rest of the site.

## The look, in one paragraph

One dark room. The floor is deep navy, panels are navy with a gold hairline,
type is cream, the accent is gold, and flag red is kept for the one primary
action or a severe mark. Headlines in the condensed display face (Big
Shoulders Display), uppercase, tight leading. Kickers are small, gold,
letterspaced sans. Body copy stays the serif at a comfortable size. Photos sit
in framed panels with a soft black shadow; real photos, court scans, and scene
art each carry a provenance tag where the page is about the record. Film grain
sits over everything at low opacity. Sections and cards rise in once as they
enter; live numbers count up; nothing is hidden when JavaScript is off; every
effect is off under `prefers-reduced-motion`. Reference implementation:
`website/app/the-story/story.css` and `website/components/story/*`.

## Tokens (the only source of color)

All colors are CSS custom properties from the `@theme` block in
`website/app/globals.css` (brand colors that non-DOM renderers need stay in
`website/styles/tokens.css`, mirrored in `lib/palette.ts`). No new hex literals
in `app/` or `components/`. Satori share cards under `app/og/` keep their
literals; they render outside the DOM.

| Token | Value | Use it for |
| --- | --- | --- |
| `--color-paper` | deep navy `#06101f` | the page floor, full-bleed section backgrounds |
| `--color-surface` | navy `#0b1b34` | cards, panels, the header glass, inputs at rest |
| `--color-surface-2` | `#10213f` | raised panels, hover states, code, focused inputs |
| `--color-line` | gold at 30% | hairlines, card borders, dividers |
| `--color-line-soft` | cream at 12% | quiet dividers inside a panel |
| `--color-ink` | cream `#fdf8ea` | body text, headings |
| `--color-ink-soft` | cream at 78% | secondary text, deks |
| `--color-muted` | cream at 56% | captions, timestamps, placeholders |
| `--color-cream` | cream `#fdf8ea` | light text and strokes on a dark or colored band (buttons, badges) |
| `--color-navy` | `#0b1b34` | a band that must read as a distinct block on the floor (pair with a gold hairline) |
| `--color-blue` | `#3d6fd1` | blue buttons and chips (background), blue borders |
| `--color-blue-ink` | `#9dbcff` | blue text, blue icons |
| `--color-blue-strong` | `#2b56aa` | blue button hover |
| `--color-blue-soft` | blue at 18% | institutional or procedural tint behind text |
| `--color-accent` | flag red `#d9382b` | the one primary action on a view, severe marks, danger |
| `--color-accent-strong` | `#b32419` | red hover |
| `--color-accent-soft` | red at 16% | red tint behind text |
| `--color-support`, `--color-gold` | gold `#e1bd5b` | money and support actions, emphasis, kickers, numerals |
| `--color-support-strong` | `#f0d27a` | gold hover |
| `--color-support-soft`, `--color-gold-soft` | gold at 14% | gold tint behind text |
| `--color-success` | `#6fd39a` | resolved, healthy, paid |
| `--color-success-soft` | green at 16% | green tint |
| `--color-tag-severe` / `-procedural` / `-institutional` / `-resolved` | red / amber / blue-ink / green | tag text and borders |

Fonts: `--font-display` (Source Serif 4) for headings and prose,
`--font-sans` (Inter) for UI and kickers, and `--font-condensed` (Big
Shoulders Display, self-hosted, weights 700 to 900) for hero titles, chapter
titles, and big numerals. Tailwind utilities: `font-display`, `font-sans`,
`font-condensed`.

## Primitives in `globals.css`

- `.btn-accent`: gold background, navy text, 8px radius. The one solid button
  per view.
- `.btn-support`: cream type on a gold rule (unchanged).
- `.btn-blue`: blue background, cream text.
- `.btn-danger`: flag red background, cream text (for the rare primary that is
  a demand or a severe action, and for the `/case` and `/the-story` heroes).
- `.panel`: surface background, gold hairline, 14px radius, soft black shadow.
- `.eyebrow`: 11px, 800, letterspaced 0.26em, uppercase, gold.
- `.display`: condensed face, 800, uppercase, 0.92 leading.
- `.grain`: the site-wide film grain sheet (mounted once in the root layout by
  `components/SiteEffects.tsx`).
- `[data-reveal]` and `[data-count]`: the reveal and count-up hooks the same
  component drives. Add `data-reveal` to a card or section that should rise
  in; add `data-count="1234"` to a number that should count up (server-render
  the final formatted value inside it).
- `.prose-body` keeps its rules; its colors come from the tokens above.

## Migration rules for a component or page

Apply these in order. Change classes, never copy, facts, or behavior.

1. **Light text on a dark or colored band.** `text-[var(--color-paper)]`,
   including opacity variants like `/70`, and any `border-`, `ring-`, `fill-`,
   `stroke-`, `divide-`, `placeholder:text-` that used `--color-paper` as a
   light foreground, becomes `--color-cream`. Leave `bg-[var(--color-paper)]`
   alone (it is now the floor) unless rule 3 applies.
2. **Dark bands written in hex.** `bg-[#071126]`, `#071123`, `#0a1429`,
   `#0b1b34`, `#0e1a36`, `#0b1428`, `#1c2a4a`, `#101a31`, `#14213d`, `#16223f`
   and the like become `bg-[var(--color-surface)]` (a card) or
   `bg-[var(--color-navy)]` (a band). Their light text (`text-[#fdf8ea]`,
   `text-[#cfd9ea]`, `text-white`, `text-[#f5f0e1]`) becomes
   `text-[var(--color-cream)]` or `text-[var(--color-ink-soft)]`. Gradients
   `from-[#..] to-[#..]` become surface-to-navy token gradients.
3. **Light blocks that were meant to pop on cream.** Cream or white chips,
   cards, and inputs (`bg-white`, `bg-[#fdf8ea]`, `bg-[#fff5d6]`, `bg-[#e9f2ff]`,
   `bg-[#e8f7ed]`, `bg-[#f7fbff]`, and `bg-[var(--color-paper)]` used as a
   light chip inside a navy band) become the theater chip or panel: a
   transparent or `--color-surface-2` background with a `--color-line`
   hairline and `--color-ink` text, or the matching soft tint
   (`--color-support-soft`, `--color-blue-soft`, `--color-success-soft`) with
   its ink color. Inputs use `--color-surface` with `--color-line`.
4. **Dark text that assumed a light surface.** `text-[var(--color-navy)]`,
   `text-[var(--color-blue)]`, `text-black`, `text-[#0b1b34]`, Tailwind grays
   (`text-gray-*`, `text-slate-*`) become `text-[var(--color-ink)]` for body,
   `text-[var(--color-blue-ink)]` for blue emphasis, `text-[var(--color-gold)]`
   for gold emphasis, `text-[var(--color-muted)]` for quiet text.
   `border-[var(--color-navy)]` and `/40` variants become
   `border-[var(--color-line)]`.
5. **Buttons.** `bg-[var(--color-navy)] text-[var(--color-paper)]` buttons
   become `btn-accent` (gold) unless they sit next to a gold button, then
   `btn-blue`. Red buttons (`bg-[var(--color-accent)]`) stay red with
   `text-[var(--color-cream)]`. Ghost buttons use `border-[var(--color-line)]`
   and `text-[var(--color-ink)]`, hover `border-[var(--color-gold)]`.
6. **Shadows and overlays.** `shadow-[...rgba(11,27,52,...)]` navy shadows
   become black at similar alpha; `bg-black/60` lightbox and modal overlays
   stay. Inline styles with hex colors follow the same table via
   `var(--color-...)`.
7. **Headings on dark sections.** The base layer now paints headings cream, so
   explicit `text-white` or `text-[#fdf8ea]` on headings simplifies to nothing
   or `text-[var(--color-ink)]`. Any heading still set to navy or ink-on-navy
   is a bug.
8. **Charts, maps, canvases.** Use `PALETTE` from `lib/palette.ts` for series,
   `--color-line-soft` for grid lines, `--color-muted` for axis text, and give
   any chart container a `panel` background. Tooltips use surface-2 with cream
   text.
9. **Images and scans.** Photos get `rounded-xl` inside a `panel` where they
   are featured; white document scans are fine on the floor with a
   `--color-line` hairline. Never add a filter that hides a face.
10. **Do not touch** copy, links, facts, analytics events, form wiring,
    `app/og/*`, `app/api/*`, `scripts/`, `tests/`, `lib/` (except `lib/palette.ts`
    if a chart needs a new mirrored color, with the matching token in
    `styles/tokens.css`), email templates, or the print stylesheet.

## Effects policy

- The grain sheet and the reveal and count-up hooks are global and cheap. Use
  `data-reveal` on the first-screen cards of a page and on section headers,
  not on every list item of a long archive list (cap at roughly the first 24
  items; deeper items render plainly).
- Heroes on the primary public pages get the photo-hero title card: a real
  photo when the page has one (a post's thumbnail, the avatar on `/about`, the
  book cover on `/book`), navy falling off toward the subject so type never
  crosses a face, gold eyebrow, condensed headline, gold rule, one support
  line. No generated faces, ever.
- Reading pages (`/posts/[slug]`, `/case/documents/*`, legal pages) keep
  motion to the title card and the reading rail; the body is still.
- Admin pages (`/admin/*`) take the tokens and nothing else: no grain, no
  reveals, no condensed type.

## Acceptance

- `npx tsc --noEmit`, `npx eslint <changed files>`, `npm test` green;
  `next build` green.
- `scripts/qa/mobile-audit.mjs` clean on every public route: 0 overflow, 0 text
  under 11px, 0 script errors.
- Screenshots at 390 and 1440 of every public route with no black-on-black
  text, no cream block floating on the floor, no navy text on navy, no
  unreadable chart.
- Every public route still serves 200 and every link that worked before works
  after.
