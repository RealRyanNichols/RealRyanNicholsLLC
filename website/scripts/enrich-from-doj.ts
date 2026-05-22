// Walks the DOJ Capitol Breach Cases master list, fetches every linked
// press release, extracts structured fields (charges, case number,
// dates, sentence summary), and:
//   1. Updates case_people with the structured data we don't have yet
//      (never overwriting claimant-edited fields — those are sacred)
//   2. Lands the full press release text into pending_imports for
//      review alongside Court Listener docs. Cross-source review is
//      where Ryan finds contradictions.
//
// Run with: npx tsx scripts/enrich-from-doj.ts
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import {
  fetchDefendantList,
  fetchPressRelease,
} from "../lib/doj-capitol-breach";
import { scoreEvidence, inferDocType } from "../lib/courtlistener";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const SLEEP_BETWEEN_RELEASES_MS = 600;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Matches a press-release subject name to a J6 defendant we already
// have. We use Postgres trigram similarity over case_people.name —
// pg_trgm gives us 'similarity(a,b) > 0.4' style queries. Returns the
// best match above threshold or null.
async function matchPerson(name: string): Promise<
  { id: string; name: string; slug: string; sim: number } | null
> {
  const { data, error } = await supabase
    .rpc("match_person_by_name", { needle: name, min_sim: 0.45 });
  if (error) {
    console.warn("match RPC failed:", error.message);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0];
}

// Pulls the columns that are SAFE to overwrite (we never touch
// description, photo_url, support_url, news_links — those may be
// claimant-edited). Only fills NULLs.
async function enrichPersonNullsOnly(
  personId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  // Read current row so we only set fields that are currently null.
  const { data: row } = await supabase
    .from("case_people")
    .select(
      "case_number, court, arrest_date, plea_date, sentence_date, sentence_summary, disposition, charges, doj_url",
    )
    .eq("id", personId)
    .maybeSingle();
  if (!row) return;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") continue;
    const current = (row as Record<string, unknown>)[k];
    if (current == null || (Array.isArray(current) && current.length === 0)) {
      safe[k] = v;
    }
  }
  if (Object.keys(safe).length === 0) return;
  safe.enriched_at = new Date().toISOString();
  safe.enriched_source = "doj";
  const { error } = await supabase
    .from("case_people")
    .update(safe)
    .eq("id", personId);
  if (error) {
    console.warn(`enrich failed for ${personId}:`, error.message);
  }
}

async function landAsPendingImport(opts: {
  source_id: string;
  source_url: string;
  title: string;
  bodyText: string;
  personId: string | null;
  matchSim: number | null;
  caseLabel: string | null;
  documentDate: string | null;
}): Promise<void> {
  const { themes, importance } = scoreEvidence(opts.title + " · " + opts.bodyText);
  const description = opts.bodyText.slice(0, 1800);
  const row = {
    source: "doj",
    source_id: opts.source_id,
    source_url: opts.source_url,
    person_id: opts.personId,
    match_confidence: opts.matchSim,
    title: opts.title.slice(0, 250),
    description,
    doc_type: inferDocType(opts.title) === "other" ? "letter" : inferDocType(opts.title),
    document_date: opts.documentDate,
    external_url: opts.source_url,
    source_label: opts.caseLabel ?? "U.S. Attorney's Office, D.D.C. — Capitol Breach press release",
    raw_data: null,
    review_status: "pending",
    evidence_themes: themes.length > 0 ? themes : null,
    importance_score: importance,
  };
  const { error, status } = await supabase.from("pending_imports").insert(row);
  if (error && status !== 409 && error.code !== "23505") {
    console.warn(`pending_imports insert failed:`, error.message);
  }
}

async function main() {
  console.log("Fetching DOJ Capitol Breach Cases master list…");
  const links = await fetchDefendantList();
  console.log(`Found ${links.length} press release links.`);

  let processed = 0;
  let enriched = 0;
  let imported = 0;
  let unmatched = 0;
  let errors = 0;

  for (const link of links) {
    try {
      const entry = await fetchPressRelease(link.url);
      const match = await matchPerson(entry.name);
      if (!match) {
        unmatched++;
        await landAsPendingImport({
          source_id: `doj-${entry.doj_url}`,
          source_url: entry.doj_url,
          title: `${entry.name} — ${entry.status ?? "press release"}`,
          bodyText: entry.raw_html,
          personId: null,
          matchSim: null,
          caseLabel: entry.case_number
            ? `U.S. Attorney's Office, D.D.C. — ${entry.case_number}`
            : null,
          documentDate:
            entry.sentence_date ?? entry.arrest_date ?? null,
        });
        imported++;
      } else {
        await enrichPersonNullsOnly(match.id, {
          case_number: entry.case_number,
          court: "U.S. District Court for the District of Columbia",
          arrest_date: entry.arrest_date,
          sentence_date: entry.sentence_date,
          sentence_summary: entry.sentence_summary,
          disposition: entry.status,
          charges: entry.charges.length > 0 ? entry.charges : null,
          doj_url: entry.doj_url,
        });
        enriched++;
        await landAsPendingImport({
          source_id: `doj-${entry.doj_url}`,
          source_url: entry.doj_url,
          title: `${entry.name} — ${entry.status ?? "press release"}`,
          bodyText: entry.raw_html,
          personId: match.id,
          matchSim: match.sim,
          caseLabel: entry.case_number
            ? `U.S. Attorney's Office, D.D.C. — ${entry.case_number}`
            : null,
          documentDate:
            entry.sentence_date ?? entry.arrest_date ?? null,
        });
        imported++;
      }
    } catch (e) {
      errors++;
      console.warn(`error on ${link.url}:`, e instanceof Error ? e.message : e);
    }
    processed++;
    if (processed % 25 === 0) {
      console.log(
        `[${processed}/${links.length}] enriched=${enriched} imported=${imported} unmatched=${unmatched} errors=${errors}`,
      );
    }
    await sleep(SLEEP_BETWEEN_RELEASES_MS);
  }

  console.log(
    `Done. processed=${processed} enriched=${enriched} imported=${imported} unmatched=${unmatched} errors=${errors}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
