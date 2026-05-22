// Court Listener API wrapper. Court Listener (https://www.courtlistener.com)
// is the free PACER mirror operated by the Free Law Project; their API is
// the legitimate way to pull J6 federal-court filings without paying PACER
// per page. We use it for the auto-import pipeline.
//
// Auth: set COURTLISTENER_API_TOKEN in env. Anonymous access works for
// search but is heavily rate-limited; an authenticated free account gives
// generous limits (~10k requests/day at this writing).

const CL_BASE = "https://www.courtlistener.com/api/rest/v3";

// J6 cases were almost all filed in the U.S. District Court for the
// District of Columbia. Constraining by court + filed-after avoids
// picking up unrelated defendants with the same name.
export const J6_COURT_CODE = "dcd";
export const J6_FILED_AFTER = "2021-01-06";

export type CLDocketHit = {
  id: number;
  case_name: string | null;
  docket_number: string | null;
  court: string | null;
  date_filed: string | null;
  absolute_url: string | null;
};

export type CLRecapDoc = {
  id: number;
  description: string | null;
  document_number: string | null;
  document_type: string | null;
  date_upload: string | null;
  page_count: number | null;
  absolute_url: string | null;
  filepath_local: string | null;
  filepath_ia: string | null;
  is_available: boolean | null;
  docket_entry: number | null;
};

export type CLDocketEntry = {
  id: number;
  date_filed: string | null;
  entry_number: number | null;
  description: string | null;
  recap_documents: number[];
};

export class CourtListenerError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function authHeaders(): HeadersInit {
  const token = process.env.COURTLISTENER_API_TOKEN;
  return token ? { Authorization: `Token ${token}` } : {};
}

async function clFetch<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${CL_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CourtListenerError(
      `Court Listener ${res.status}: ${body.slice(0, 200)}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

// Searches for dockets matching a defendant by name, scoped to the DC
// District Court and the J6 window. Returns dockets ranked by CL's own
// relevance score.
export async function searchJ6Dockets(
  defendantName: string,
): Promise<CLDocketHit[]> {
  const params = new URLSearchParams({
    type: "r",
    q: `"${defendantName}"`,
    court: J6_COURT_CODE,
    filed_after: J6_FILED_AFTER,
    order_by: "score desc",
  });
  const data = await clFetch<{ results: CLDocketHit[] }>(
    `/search/?${params.toString()}`,
  );
  return data.results ?? [];
}

// Returns all docket entries for a docket, paginating through CL's
// 20-per-page response.
export async function listDocketEntries(
  docketId: number,
): Promise<CLDocketEntry[]> {
  let next: string | null = `/docket-entries/?docket=${docketId}&order_by=entry_number`;
  const out: CLDocketEntry[] = [];
  while (next) {
    const page: { results: CLDocketEntry[]; next: string | null } =
      await clFetch(next);
    out.push(...(page.results ?? []));
    next = page.next;
  }
  return out;
}

// Returns recap documents for one docket entry. CL stores these as a
// many-to-one (multiple PDFs can attach to a single docket entry).
export async function getRecapDocs(ids: number[]): Promise<CLRecapDoc[]> {
  if (ids.length === 0) return [];
  // Court Listener accepts list filtering on id__in.
  const params = new URLSearchParams({ id__in: ids.join(",") });
  const data = await clFetch<{ results: CLRecapDoc[] }>(
    `/recap-documents/?${params.toString()}`,
  );
  return data.results ?? [];
}

// Evidence themes Ryan cares about across J6 cases. We scan document
// titles + descriptions for these patterns so the review queue can
// surface the docs most likely to contain entrapment, abuse, misuse of
// force, lies, or contradictions — not the 1,000 routine scheduling
// orders also on the docket.
const THEME_PATTERNS: Array<{ theme: string; rx: RegExp }> = [
  {
    theme: "entrapment",
    rx: /\b(entrap|inducement|confidential informant|undercover|CHS|government asset|FBI asset)\b/i,
  },
  {
    theme: "excessive_force",
    rx: /\b(excessive force|less[- ]lethal|munition|rubber bullet|tear gas|flash[- ]bang|baton|chemical (?:agent|spray)|pepper spray|projectile|crowd[- ]control)\b/i,
  },
  {
    theme: "death_or_injury",
    rx: /\b(death|died|killed|fatal(?:ity)?|seriously injured|critical condition|hospitaliz|brain injury|concussion)\b/i,
  },
  {
    theme: "police_misconduct",
    rx: /\b(Capitol Police|MPD|officer (?:lied|misled|perjur)|misconduct|coverup|cover[- ]up|withheld evidence|destroyed evidence)\b/i,
  },
  {
    theme: "government_lies",
    rx: /\b(false statement|perjur|mislead|misled|brady (?:violation|disclosure)|exculpatory|knowingly false|materially false)\b/i,
  },
  {
    theme: "contradiction",
    rx: /\b(contradict|inconsisten|prior statement|impeach|recant)\b/i,
  },
  {
    theme: "due_process",
    rx: /\b(speedy trial|pretrial detention|bail (?:denied|review)|conditions of (?:release|confinement)|sixth amendment|fifth amendment|first amendment)\b/i,
  },
  {
    theme: "abuse_in_custody",
    rx: /\b(solitary|medical (?:neglect|denial)|denied medical|beaten|abuse|mistreat|sleep deprivation|black hole)\b/i,
  },
];

export type EvidenceScore = { themes: string[]; importance: number };

// Returns themes matched + an importance score (sum of weights). Higher
// = more interesting to review first.
export function scoreEvidence(text: string | null): EvidenceScore {
  if (!text) return { themes: [], importance: 0 };
  const themes: string[] = [];
  let importance = 0;
  for (const { theme, rx } of THEME_PATTERNS) {
    if (rx.test(text)) {
      themes.push(theme);
      // Death/injury and excessive force get extra weight — those are
      // the headline-level evidence Ryan most needs surfaced.
      importance +=
        theme === "death_or_injury" || theme === "excessive_force"
          ? 3
          : theme === "government_lies" || theme === "police_misconduct"
            ? 2
            : 1;
    }
  }
  return { themes, importance };
}

// Maps Court Listener doc descriptions into our case_doc_type enum.
// Best-effort — admin can correct during review.
export function inferDocType(description: string | null): string {
  const d = (description ?? "").toLowerCase();
  if (/indictment/.test(d)) return "indictment";
  if (/motion/.test(d)) return "motion";
  if (/order/.test(d)) return "order";
  if (/ruling|opinion|memorandum/.test(d)) return "ruling";
  if (/transcript/.test(d)) return "transcript";
  if (/affidavit/.test(d)) return "affidavit";
  if (/docket/.test(d)) return "docket";
  if (/exhibit/.test(d)) return "exhibit";
  if (/discovery/.test(d)) return "discovery";
  if (/letter/.test(d)) return "letter";
  return "other";
}

// Resolves a CL recap doc to a downloadable URL when available. CL
// hosts files on its own CDN (filepath_local) or mirrors them on the
// Internet Archive (filepath_ia). Returns null if neither is set.
export function recapDocUrl(d: CLRecapDoc): string | null {
  if (d.filepath_local) {
    return `https://www.courtlistener.com${d.filepath_local}`;
  }
  if (d.filepath_ia) return d.filepath_ia;
  if (d.absolute_url) {
    return `https://www.courtlistener.com${d.absolute_url}`;
  }
  return null;
}
