// Scraper for the U.S. Attorney's Office, D.D.C. "Capitol Breach Cases"
// page — https://www.justice.gov/usao-dc/capitol-breach-cases — which is
// the government's own master listing of every J6 defendant. We use it
// to enrich case_people with case numbers, charges, disposition, and to
// surface the DOJ press release text into pending_imports (where it can
// be reviewed alongside Court Listener docs for contradictions).

const DOJ_BASE = "https://www.justice.gov";
const DOJ_LIST_URL =
  "https://www.justice.gov/usao-dc/capitol-breach-cases";

export type DOJEntry = {
  name: string;
  age: number | null;
  location: string | null;
  case_number: string | null;
  charges: string[];
  arrest_date: string | null; // ISO YYYY-MM-DD
  plea_date: string | null;
  sentence_date: string | null;
  sentence_summary: string | null;
  status: string | null;          // text — disposition snippet
  doj_url: string;                // canonical link to the entry on DOJ
  press_releases: Array<{ url: string; title: string; date: string | null }>;
  raw_html: string;               // for debugging / re-parse
};

async function getHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "RealRyanNichols-J6Archiver/1.0 (https://realryannichols.com)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`DOJ ${res.status} for ${url}`);
  }
  return res.text();
}

// Cheap regex-based parser. The DOJ pages are server-rendered HTML
// with consistent enough structure that a parser pulled in just for
// this would be overkill. Each defendant entry follows the pattern:
//
//   <h2><a href="/usao-dc/pr/...">Defendant Name</a></h2>
//   <p>...location, charges, dates...</p>
//
// or sometimes inline list items. We grab href + name; the rest comes
// from the linked detail page.
export function parseDefendantList(html: string): Array<{
  name: string;
  url: string;
}> {
  // Match anchors that point at /usao-dc/pr/... (press release URLs) and
  // sit inside the defendants section. We're deliberately permissive —
  // every press release linked from this page is a J6 case.
  const out: Array<{ name: string; url: string }> = [];
  const seen = new Set<string>();
  const rx =
    /<a[^>]+href="(\/(?:usao-dc|opa)\/pr\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    const url = `${DOJ_BASE}${m[1]}`;
    const name = decodeHtmlEntities(m[2]).trim();
    if (!name || seen.has(url)) continue;
    seen.add(url);
    out.push({ name, url });
  }
  return out;
}

// Pulls the structured-ish data we can get from a press release page.
// DOJ press releases follow consistent prose patterns ("X, [age], of
// [location], was [charged|sentenced] with [count] count of [statute]").
export function parsePressRelease(html: string): {
  charges: string[];
  case_number: string | null;
  arrest_date: string | null;
  sentence_date: string | null;
  sentence_summary: string | null;
  status: string | null;
  body_text: string;
} {
  const body = extractMainText(html);

  // Statute citations like "18 U.S.C. § 1512(c)(2)" or "Title 18, United
  // States Code, Section 111(a)(1)".
  const charges = new Set<string>();
  const stRx =
    /\b(?:18|26|42)\s*U\.?S\.?C\.?\s*(?:§|Section)\s*\d{1,5}(?:\([a-z0-9]+\))*/gi;
  for (const m of body.matchAll(stRx)) {
    charges.add(m[0].replace(/\s+/g, " ").trim());
  }
  const titleRx =
    /\bTitle\s+(\d+),?\s*United\s*States\s*Code,?\s*Section\s*\d{1,5}(?:\([a-z0-9]+\))*/gi;
  for (const m of body.matchAll(titleRx)) {
    charges.add(m[0].replace(/\s+/g, " ").trim());
  }

  // Case number e.g. "Case No. 1:21-cr-00117" or "1:21-mj-00528".
  const caseNumMatch = body.match(
    /\b(\d{1,2}:\d{2}-(?:cr|mj|cv)-\d{3,6})/i,
  );
  const case_number = caseNumMatch ? caseNumMatch[1] : null;

  // Dates — the press release says "arrested on January 18, 2021" or
  // "On June 5, 2023, ... was sentenced".
  const arrest_date = isoDateAfter(body, /\barrested\s+on\s+([A-Z][a-z]+ \d{1,2}, \d{4})/i);
  const sentence_date = isoDateAfter(body, /\bsentenced(?:\s+on)?\s+(?:to[^.]+(?:on)\s+)?([A-Z][a-z]+ \d{1,2}, \d{4})/i);

  // Sentence summary — match the "to X months/years of imprisonment"
  // pattern that appears in sentencing pieces.
  const sentMatch = body.match(
    /sentenced\s+to\s+([^.]{6,200}?(?:imprisonment|incarceration|probation|home detention|community service))/i,
  );
  const sentence_summary = sentMatch ? sentMatch[1].trim() : null;

  // Status — peek at the first sentence's verb to classify.
  let status: string | null = null;
  if (/\bsentenced\b/i.test(body)) status = "sentenced";
  else if (/\bpleaded?\s+guilty\b/i.test(body)) status = "plea";
  else if (/\bconvicted\b/i.test(body)) status = "convicted";
  else if (/\bindicted\b/i.test(body)) status = "indicted";
  else if (/\bcharged\b/i.test(body)) status = "charged";
  else if (/\barrested\b/i.test(body)) status = "arrested";

  return {
    charges: [...charges],
    case_number,
    arrest_date,
    sentence_date,
    sentence_summary,
    status,
    body_text: body,
  };
}

function isoDateAfter(text: string, rx: RegExp): string | null {
  const m = text.match(rx);
  if (!m) return null;
  const d = new Date(m[1]);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Strips HTML tags and collapses whitespace. We're not trying to
// preserve formatting — just get readable text for regex extraction.
function extractMainText(html: string): string {
  // Drop <script>, <style>, and <nav> blocks first; they're noise.
  const stripped = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(stripped).replace(/\s+/g, " ").trim();
}

export async function fetchDefendantList(): Promise<
  Array<{ name: string; url: string }>
> {
  const html = await getHtml(DOJ_LIST_URL);
  return parseDefendantList(html);
}

export async function fetchPressRelease(url: string): Promise<DOJEntry> {
  const html = await getHtml(url);
  const parsed = parsePressRelease(html);

  // Extract the title for the press release from <title> tag or h1.
  const titleMatch =
    html.match(/<title>([^<]+)<\/title>/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch
    ? decodeHtmlEntities(titleMatch[1]).replace(/\s*\|\s*USAO[^|]*$/, "").trim()
    : url;

  // Try to pull the defendant name from the title.
  const nameMatch = title.match(
    /(?:U\.S\. v\. )?([A-Z][a-zA-Z'.-]+(?:\s+[A-Z][a-zA-Z'.-]+){1,3})/,
  );
  const name = nameMatch ? nameMatch[1].trim() : title;

  return {
    name,
    age: null,
    location: null,
    case_number: parsed.case_number,
    charges: parsed.charges,
    arrest_date: parsed.arrest_date,
    plea_date: null,
    sentence_date: parsed.sentence_date,
    sentence_summary: parsed.sentence_summary,
    status: parsed.status,
    doj_url: url,
    press_releases: [{ url, title, date: null }],
    raw_html: parsed.body_text.slice(0, 8000),
  };
}
