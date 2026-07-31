import { notFound } from "next/navigation";
import { PostBody } from "@/components/PostBody";

// Acceptance-test fixture for the article-richness vocabulary. Renders every
// shortcode, plus the malformed/unknown/fenced cases that must degrade
// gracefully. Gated behind SHORTCODE_TEST=1 so it never exists in production.

const FIXTURE = `
This article opens with prose. It mentions Fighting Shadows once, then
Fighting Shadows again, and the second mention must stay plain text.

## A heading that mentions Fighting Shadows and must not get linked

{{callout: pull | The record does not lie. People do.}}

{{receipt: {
  "label": "FACT",
  "claim": "Ryan Nichols was detained 1,463 days and pardoned January 20, 2025.",
  "source": "Judgment, 1:21-cr-00117 (D.D.C.)",
  "url": "https://www.courtlistener.com/docket/59293148/united-states-v-nichols/",
  "exhibit_id": "EX-TEST-01",
  "note": "Docket copy on file."
}}}

{{receipt: {
  "label": "SEALED",
  "claim": "A sealed matter exists and is not discussed here.",
  "source": "Under seal",
  "url": "https://example.com/must-never-render",
  "image": "https://example.com/must-never-render.png"
}}}

{{chart: {
  "type": "bar",
  "title": "Days detained by phase",
  "caption": "Detention phases of United States v. Nichols.",
  "source": "Court record, 1:21-cr-00117",
  "data": [
    {"label": "DC Jail", "value": 723},
    {"label": "Transit", "value": 141},
    {"label": "Post-plea", "value": 599}
  ]
}}}

{{chart: {
  "type": "bar",
  "title": "This chart has no source and must not render in production",
  "data": [{"label": "X", "value": 1}]
}}}

{{figure: {
  "src": "/icons/icon-192.png",
  "alt": "The site mark, used here as a figure test image",
  "caption": "A figure with alt text renders.",
  "credit": "RRN",
  "width": "inline"
}}}

{{figure: {
  "src": "/icons/icon-192.png",
  "caption": "This figure has no alt and must not render in production"
}}}

{{embed: {
  "platform": "youtube",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "caption": "Zero platform scripts load until the button is clicked."
}}}

{{callout: key | Every claim carries its label. That is the whole system.}}

{{callout: ask | Read the case archive and share one document. /case}}

{{related: judge-hogan-on-the-record | george-tanios-pleaded-first-walked}}

{{notarealshortcode: this must render as literal text}}

{{receipt: {"label": "FACT", broken json must render literally}}}

A fenced code block must SHOW a shortcode without running it:

\`\`\`
{{poll: This question? | Must not | Render}}
\`\`\`

{{poll: Does the fixture work? | Yes | No}}

Closing prose after every block.
`;

export default function ShortcodeTestPage() {
  if (process.env.SHORTCODE_TEST !== "1") notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-3xl font-black">Shortcode fixture</h1>
      <PostBody body={FIXTURE} interactive postId="00000000-0000-0000-0000-000000000000" slug="shortcode-test" title="Fixture" />
    </article>
  );
}
