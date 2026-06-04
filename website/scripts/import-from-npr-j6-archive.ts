// Imports NPR's Jan. 6 Archive into the same review queue used by the
// CourtListener and DOJ importers. NPR is treated as a source record:
// we preserve raw data and match confidence, then admins decide what
// becomes public case-file evidence.
//
// Run:
//   npx tsx scripts/import-from-npr-j6-archive.ts --dry-run
//   npx tsx scripts/import-from-npr-j6-archive.ts
//
// Env for writes:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { scoreEvidence } from "../lib/courtlistener";
import {
  NPR_J6_ARCHIVE_URL,
  buildNprImportDescription,
  fetchNprJ6Archive,
  normalizeNprJ6Record,
  type NormalizedNprJ6Record,
} from "../lib/npr-j6-archive";

type PersonMatch = {
  id: string;
  name: string;
  slug: string;
  sim: number;
};

type CasePersonPatchable = {
  arrest_date: string | null;
  sentence_summary: string | null;
  disposition: string | null;
  charges: string[] | null;
  news_links: string[] | null;
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limitValue = limitArg ? Number.parseInt(limitArg.split("=")[1] ?? "", 10) : null;
const LIMIT =
  limitValue !== null && Number.isFinite(limitValue)
    ? Math.max(0, limitValue)
    : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  !DRY_RUN && SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false },
      })
    : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use --dry-run to inspect NPR data without writing.",
    );
  }
  return supabase;
}

async function matchPerson(name: string): Promise<PersonMatch | null> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("match_person_by_name", {
    needle: name,
    min_sim: 0.45,
  });
  if (error) {
    console.warn(`match RPC failed for ${name}: ${error.message}`);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as PersonMatch;
}

async function startRun(total: number): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("import_runs")
    .insert({
      source: "npr_j6_archive",
      status: "running",
      people_total: total,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function updateRun(runId: string, patch: Record<string, unknown>) {
  const db = requireSupabase();
  const { error } = await db.from("import_runs").update(patch).eq("id", runId);
  if (error) throw error;
}

async function enrichPersonNullsOnly(
  personId: string,
  record: NormalizedNprJ6Record,
) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("case_people")
    .select("arrest_date, sentence_summary, disposition, charges, news_links")
    .eq("id", personId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn(`case_people read failed: ${error.message}`);
    return;
  }

  const current = data as CasePersonPatchable;
  const safe: Record<string, unknown> = {};

  if (!current.arrest_date && record.firstArrestDate) {
    safe.arrest_date = record.firstArrestDate;
  }
  if (!current.sentence_summary && record.raw.case_updates) {
    safe.sentence_summary = record.raw.case_updates.trim();
  }
  if (!current.disposition && record.raw.case_status) {
    safe.disposition = record.raw.case_status.trim();
  }
  if ((!current.charges || current.charges.length === 0) && record.charges.length > 0) {
    safe.charges = record.charges;
  }

  const links = new Set(current.news_links ?? []);
  links.add(NPR_J6_ARCHIVE_URL);
  if (record.videoUrl) links.add(record.videoUrl);
  if (record.chargesLink) links.add(record.chargesLink);
  const nextLinks = [...links].filter(Boolean);
  if (nextLinks.length !== (current.news_links ?? []).length) {
    safe.news_links = nextLinks;
  }

  if (Object.keys(safe).length === 0) return;
  safe.enriched_at = new Date().toISOString();
  safe.enriched_source = "npr_j6_archive";

  const { error: updateError } = await db
    .from("case_people")
    .update(safe)
    .eq("id", personId);
  if (updateError) {
    console.warn(`case_people enrich failed for ${personId}: ${updateError.message}`);
  }
}

async function landAsPendingImport(
  record: NormalizedNprJ6Record,
  match: PersonMatch | null,
) {
  const db = requireSupabase();
  const description = buildNprImportDescription(record);
  const scoreText = [
    record.name,
    record.raw.summary,
    record.raw.case_updates,
    record.raw.charges,
    Object.entries(record.flags)
      .filter(([, yes]) => yes)
      .map(([flag]) => flag.replace(/_/g, " "))
      .join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const { themes, importance } = scoreEvidence(scoreText);

  const row = {
    source: "npr_j6_archive",
    source_id: record.sourceId,
    source_url: NPR_J6_ARCHIVE_URL,
    person_id: match?.id ?? null,
    match_confidence: match?.sim ?? null,
    title: `${record.name} - NPR Jan. 6 Archive profile`.slice(0, 250),
    description,
    doc_type: "other",
    document_date: record.firstArrestDate,
    external_url: record.videoUrl ?? record.chargesLink ?? NPR_J6_ARCHIVE_URL,
    source_label: "NPR Jan. 6 Archive - The Capitol Charges",
    raw_data: {
      normalized: {
        name: record.name,
        location: record.location,
        charges: record.charges,
        arrest_dates: record.arrestDates,
        photo_url: record.photoUrl,
        video_url: record.videoUrl,
        charges_link: record.chargesLink,
        courtlistener_docket_id: record.courtlistenerDocketId,
        flags: record.flags,
      },
      npr: record.raw,
    },
    review_status: "pending",
    evidence_themes: themes.length > 0 ? themes : null,
    importance_score: importance,
  };

  const { error, status } = await db.from("pending_imports").insert(row);
  if (error) {
    if (status === 409 || error.code === "23505") return "duplicate" as const;
    throw error;
  }
  return "inserted" as const;
}

async function main() {
  const raw = await fetchNprJ6Archive();
  const records = raw
    .map((r, i) => normalizeNprJ6Record(r, i))
    .filter((r) => r.flags.published);
  const selected = LIMIT !== null ? records.slice(0, LIMIT) : records;

  const flagCounts = selected.reduce<Record<string, number>>((acc, r) => {
    for (const [flag, yes] of Object.entries(r.flags)) {
      if (yes) acc[flag] = (acc[flag] ?? 0) + 1;
    }
    return acc;
  }, {});

  console.log(
    `NPR Jan. 6 Archive loaded: ${records.length} published records from ${NPR_J6_ARCHIVE_URL}`,
  );
  console.log(
    "Review queue only: this script stages NPR records into pending_imports for admin review. It does not publish public case documents.",
  );
  console.log(
    `Flags: ${Object.entries(flagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
  );

  if (DRY_RUN) {
    console.log(`Dry run only. Records selected: ${selected.length}`);
    console.log(
      JSON.stringify(
        selected.slice(0, 5).map((r) => ({
          sourceId: r.sourceId,
          name: r.name,
          location: r.location,
          firstArrestDate: r.firstArrestDate,
          chargesCount: r.charges.length,
          courtlistenerDocketId: r.courtlistenerDocketId,
          hasVideo: Boolean(r.videoUrl),
          hasPhoto: Boolean(r.photoUrl),
        })),
        null,
        2,
      ),
    );
    return;
  }

  if (!supabase) requireSupabase();

  const runId = await startRun(selected.length);
  let processed = 0;
  let matched = 0;
  let inserted = 0;
  let duplicated = 0;
  let unmatched = 0;
  let errors = 0;

  for (const record of selected) {
    try {
      const match = await matchPerson(record.name);
      if (match) {
        matched++;
        await enrichPersonNullsOnly(match.id, record);
      } else {
        unmatched++;
      }

      const result = await landAsPendingImport(record, match);
      if (result === "inserted") inserted++;
      else duplicated++;
    } catch (e) {
      errors++;
      console.warn(
        `NPR import failed for ${record.name}:`,
        e instanceof Error ? e.message : e,
      );
    }

    processed++;
    if (processed % 50 === 0) {
      await updateRun(runId, {
        people_processed: processed,
        documents_found: inserted,
        documents_skipped: duplicated,
        errors_count: errors,
        cursor_person_slug: record.slug,
      });
      console.log(
        `[${processed}/${selected.length}] matched=${matched} inserted=${inserted} duplicate=${duplicated} unmatched=${unmatched} errors=${errors}`,
      );
    }
  }

  await updateRun(runId, {
    status: "completed",
    finished_at: new Date().toISOString(),
    people_processed: processed,
    documents_found: inserted,
    documents_skipped: duplicated,
    errors_count: errors,
  });

  console.log(
    `Done. processed=${processed} matched=${matched} inserted=${inserted} duplicate=${duplicated} unmatched=${unmatched} errors=${errors}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
