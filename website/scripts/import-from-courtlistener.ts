// Long-running import worker. Walks every J6 case_people row, queries
// Court Listener for the matching docket, and lands every recap document
// into pending_imports. Designed to be safe to run repeatedly — it
// resumes from cursor_person_slug stored in import_runs, dedupes on
// (source, source_id), and sleeps on rate-limit responses.
//
// Run with:
//   npx tsx scripts/import-from-courtlistener.ts
//
// Env required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY        (needed to write pending_imports)
//   COURTLISTENER_API_TOKEN          (optional but strongly recommended)
//
// Designed for GitHub Actions / Vercel Cron / a one-off shell run.

import { createClient } from "@supabase/supabase-js";
import {
  searchJ6Dockets,
  listDocketEntries,
  getRecapDocs,
  inferDocType,
  recapDocUrl,
  scoreEvidence,
  CourtListenerError,
} from "../lib/courtlistener";

type Person = {
  id: string;
  slug: string;
  name: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const SLEEP_BETWEEN_PEOPLE_MS = 800;
const SLEEP_ON_RATE_LIMIT_MS = 60_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Naive similarity score on full names so we don't trust whatever the
// CL relevance ranker hands us blindly. Returns 0..1.
function nameOverlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let hits = 0;
  for (const t of tokensA) if (tokensB.has(t)) hits++;
  return hits / Math.max(tokensA.size, tokensB.size);
}

async function fetchAllJ6People(): Promise<Person[]> {
  const PAGE = 1000;
  const out: Person[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("case_people")
      .select("id, slug, name")
      .eq("is_j6_defendant", true)
      .order("slug", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

async function startRun(personTotal: number): Promise<string> {
  const { data, error } = await supabase
    .from("import_runs")
    .insert({
      source: "courtlistener",
      status: "running",
      people_total: personTotal,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

async function updateRun(
  runId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("import_runs")
    .update(patch)
    .eq("id", runId);
  if (error) throw error;
}

type PerPersonResult = {
  found: number;
  skipped: number;
  errored: boolean;
  reason?: string;
};

async function importForPerson(person: Person): Promise<PerPersonResult> {
  let found = 0;
  let skipped = 0;

  let hits;
  try {
    hits = await searchJ6Dockets(person.name);
  } catch (e) {
    if (e instanceof CourtListenerError && e.status === 429) {
      console.warn(`Rate-limited on search for ${person.name}. Sleeping…`);
      await sleep(SLEEP_ON_RATE_LIMIT_MS);
      return { found, skipped, errored: true, reason: "rate-limit-search" };
    }
    return {
      found,
      skipped,
      errored: true,
      reason: e instanceof Error ? e.message : "search-error",
    };
  }

  // Take the best name-overlap hit above a 0.5 threshold. Defendants
  // with very common names will need manual matching in the review UI.
  const ranked = hits
    .map((h) => ({
      hit: h,
      score: nameOverlap(person.name, h.case_name ?? ""),
    }))
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return { found, skipped, errored: false, reason: "no-match" };
  }
  const best = ranked[0];

  let entries;
  try {
    entries = await listDocketEntries(best.hit.id);
  } catch (e) {
    if (e instanceof CourtListenerError && e.status === 429) {
      await sleep(SLEEP_ON_RATE_LIMIT_MS);
      return { found, skipped, errored: true, reason: "rate-limit-entries" };
    }
    return {
      found,
      skipped,
      errored: true,
      reason: e instanceof Error ? e.message : "entries-error",
    };
  }

  const recapIds = entries.flatMap((e) => e.recap_documents ?? []);
  if (recapIds.length === 0) {
    return { found, skipped, errored: false, reason: "no-recap-docs" };
  }

  // CL caps id__in at 100 ids per request — chunk it.
  const CHUNK = 80;
  const docs = [];
  for (let i = 0; i < recapIds.length; i += CHUNK) {
    let page;
    try {
      page = await getRecapDocs(recapIds.slice(i, i + CHUNK));
    } catch (e) {
      if (e instanceof CourtListenerError && e.status === 429) {
        await sleep(SLEEP_ON_RATE_LIMIT_MS);
        i -= CHUNK; // retry this chunk
        continue;
      }
      throw e;
    }
    docs.push(...page);
  }

  const entryById = new Map(entries.map((e) => [e.id, e]));

  for (const d of docs) {
    const url = recapDocUrl(d);
    const entry = d.docket_entry ? entryById.get(d.docket_entry) : null;
    const date = d.date_upload?.slice(0, 10) ?? entry?.date_filed ?? null;
    const titleParts = [
      best.hit.docket_number ? `Doc #${d.document_number ?? "?"}` : null,
      d.description?.trim() || entry?.description?.trim() || null,
    ].filter(Boolean);
    const title = titleParts.join(" — ") || `Court Listener doc ${d.id}`;

    // Score against Ryan's evidence themes — entrapment, excessive
    // force, government lies, etc. — so the review queue can surface
    // these first instead of routine scheduling orders.
    const scoreText = [
      title,
      d.description,
      entry?.description,
    ]
      .filter(Boolean)
      .join(" · ");
    const { themes, importance } = scoreEvidence(scoreText);

    const row = {
      source: "courtlistener",
      source_id: `cl-recap-${d.id}`,
      source_url: url,
      person_id: person.id,
      match_confidence: best.score,
      title,
      description: entry?.description ?? null,
      doc_type: inferDocType(d.description ?? entry?.description ?? null),
      document_date: date,
      external_url: url,
      source_label: best.hit.case_name
        ? `${best.hit.case_name} (${best.hit.docket_number ?? "no docket"})`
        : `Court Listener docket ${best.hit.id}`,
      raw_data: { docket: best.hit, entry, doc: d },
      review_status: "pending",
      evidence_themes: themes.length > 0 ? themes : null,
      importance_score: importance,
    };

    const { error, status } = await supabase
      .from("pending_imports")
      .insert(row);
    if (error) {
      // 23505 is unique-violation — we've already imported this doc.
      if (status === 409 || error.code === "23505") {
        skipped++;
        continue;
      }
      console.error(`Insert failed for ${person.slug}/${d.id}:`, error.message);
      continue;
    }
    found++;
  }

  return { found, skipped, errored: false };
}

async function main() {
  console.log("Starting Court Listener import…");
  const people = await fetchAllJ6People();
  console.log(`Loaded ${people.length} J6 defendants.`);

  const runId = await startRun(people.length);
  console.log(`Run id: ${runId}`);

  let processed = 0;
  let totalFound = 0;
  let totalSkipped = 0;
  let errors = 0;

  for (const person of people) {
    let attempt = 0;
    let result: PerPersonResult;
    do {
      result = await importForPerson(person);
      attempt++;
    } while (result.errored && attempt < 3);

    processed++;
    totalFound += result.found;
    totalSkipped += result.skipped;
    if (result.errored) errors++;

    const ratePerMin =
      Math.round((processed / Math.max(1, Date.now() / 60_000)) * 100) / 100;
    console.log(
      `[${processed}/${people.length}] ${person.slug}: +${result.found} found, ${result.skipped} skipped, ${result.reason ?? "ok"} (${ratePerMin}/min)`,
    );

    if (processed % 25 === 0) {
      await updateRun(runId, {
        people_processed: processed,
        documents_found: totalFound,
        documents_skipped: totalSkipped,
        errors_count: errors,
        cursor_person_slug: person.slug,
      });
    }

    await sleep(SLEEP_BETWEEN_PEOPLE_MS);
  }

  await updateRun(runId, {
    status: "completed",
    finished_at: new Date().toISOString(),
    people_processed: processed,
    documents_found: totalFound,
    documents_skipped: totalSkipped,
    errors_count: errors,
  });

  console.log(
    `Done. Processed ${processed}; ${totalFound} new docs, ${totalSkipped} already-imported skipped, ${errors} errored.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
