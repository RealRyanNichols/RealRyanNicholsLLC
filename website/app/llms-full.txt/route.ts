import { getCaseTotals } from "@/lib/case";
import { getPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

// llms-full.txt — the deeper companion to /llms.txt: archive structure plus
// the latest posts with URLs, regenerated hourly from the live database.
export async function GET() {
  const [totals, posts] = await Promise.all([
    getCaseTotals().catch(() => null),
    getPublishedPosts().catch(() => [] as Awaited<ReturnType<typeof getPublishedPosts>>),
  ]);

  // The day count comes from lib/case.ts like every other count on the
  // site, and it is arrest to pardon, not a custody total: no facility
  // record on file sums to one yet. Without totals the lines drop the
  // number rather than guess.
  const days = totals?.daysArrestToPardon
    ? `${totals.daysArrestToPardon.toLocaleString("en-US")} days from arrest to pardon`
    : "the time from arrest to pardon";

  // The archive counts, the same way: a number from lib/case.ts or the
  // thing named without one.
  const n = (v: number | null | undefined) => (v ? v.toLocaleString("en-US") : null);
  const patterns = n(totals?.grievances)
    ? `${n(totals?.grievances)} documented grievance patterns`
    : "the documented grievance patterns";
  const forms = n(totals?.ryanFiledGrievances)
    ? `${n(totals?.ryanFiledGrievances)} grievance forms`
    : "grievance forms";
  const corroborators = n(totals?.corroborators)
    ? `${n(totals?.corroborators)} corroborating detainees`
    : "corroborating detainees";

  const latest = posts.slice(0, 20);
  const postLines = latest
    .map((p) => {
      const title = (p.title ?? p.body.replace(/\s+/g, " ").trim().slice(0, 80)) || "Note";
      const date = p.published_at ? p.published_at.slice(0, 10) : "";
      return `- ${date} — ${title}: ${SITE.url}/posts/${p.slug}`;
    })
    .join("\n");

  const body = `# RealRyanNichols.com — full index for AI consumption

> Companion to ${SITE.url}/llms.txt. Regenerated hourly from the live site.

## The case archive — United States v. Nichols (1:21-cr-00117, D.D.C.)

Structure of ${SITE.url}/case:

- Case brief: ${SITE.url}/case/brief — the case in plain language
- Damages: ${SITE.url}/case/damages — what ${days} cost
- Witnesses: ${SITE.url}/case/witnesses — corroborating witnesses on record
- Timeline: ${SITE.url}/case?view=timeline — every event, dated and sourced
- Documents: ${SITE.url}/case?view=documents — ${totals?.documents?.toLocaleString("en-US") ?? "the"} public documents (court filings, government records, grievance forms, exhibits; each carries a classification label: FACT / RYAN STATEMENT / NEEDS AUTHENTICATION)
- Grievances: ${SITE.url}/case?view=grievances — ${patterns}, drawn from the ${forms} Ryan filed from inside the DC jail
- People: ${SITE.url}/case?view=people — ${n(totals?.people) ?? "the"} people of record, including ${corroborators} and January 6 defendants
- Individual entities resolve as:
  - ${SITE.url}/case/people/<slug>
  - ${SITE.url}/case/documents/<slug>
  - ${SITE.url}/case/grievances/<slug>
  - ${SITE.url}/case/events/<slug>

Anchor facts (verified): pardoned January 20, 2025; dismissed with
prejudice; sentence was 63 months plus a $200,000 fine — the largest
fine imposed in any January 6 case; ${days}; case number
1:21-cr-00117.

## Latest 20 posts

${postLines || "(no posts published yet)"}

## Feeds

- RSS: ${SITE.url}/rss.xml
- Sitemap: ${SITE.url}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
