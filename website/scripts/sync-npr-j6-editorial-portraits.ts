/**
 * Conservatively fills J6 portrait placeholders from NPR's public
 * "The Capitol Charges" archive.
 *
 * This is intentionally not a general fuzzy-photo importer:
 *   - public J6 profiles only;
 *   - exact, unique normalized full-name matches on both sides;
 *   - existing cleared or non-placeholder photos are never replaced;
 *   - every person named in NPR's non-DOJ photo-credit exceptions is skipped;
 *   - the remote asset must return a successful image response whose bytes
 *     match its declared media type.
 *
 * The resulting rights state is "documented-editorial-use". That state records
 * provenance and the site's limited editorial-use decision; it is not a claim
 * that NPR's image is licensed to the site or is in the public domain.
 *
 * Default: dry run
 * Apply:   npx tsx scripts/sync-npr-j6-editorial-portraits.ts --apply
 * Report:  add --summary=/path/to/summary.json
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  NPR_J6_ARCHIVE_URL,
  extractNprJ6Data,
  normalizeNprJ6Record,
  type NormalizedNprJ6Record,
} from "../lib/npr-j6-archive";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const SUMMARY_PATH = process.argv
  .find((arg) => arg.startsWith("--summary="))
  ?.slice("--summary=".length);
const VALIDATION_CONCURRENCY = 12;
const UPDATE_BATCH_SIZE = 25;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const NPR_IMAGE_ORIGIN = "https://apps.npr.org";
const NPR_IMAGE_PATH_PREFIX =
  "/jan-6-archive/assets/synced/images/database/";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type CasePersonPortrait = {
  id: string;
  slug: string;
  name: string;
  case_number: string | null;
  visibility: string;
  is_j6_defendant: boolean;
  photo_url: string | null;
  photo_alt_text: string | null;
  photo_source_name: string | null;
  photo_source_url: string | null;
  photo_credit: string | null;
  photo_rights_status: string | null;
  photo_identity_status: string | null;
  photo_verification_notes: string | null;
  photo_verified_at: string | null;
  photo_is_placeholder: boolean;
};

type CreditException = {
  marker: string;
  name: string;
  credit: string;
};

type PortraitCandidate = {
  person: CasePersonPortrait;
  record: NormalizedNprJ6Record;
};

type ValidatedCandidate = PortraitCandidate & {
  validation: {
    contentType: string;
    httpStatus: number;
    validatedAt: string;
  };
};

type ValidationResult =
  | { ok: true; candidate: ValidatedCandidate }
  | { ok: false; name: string; url: string; reason: string };

type SyncSummary = {
  mode: "dry-run" | "apply";
  generatedAt: string;
  sourceUrl: string;
  sourcePhotoCreditLine: string;
  semantics: string;
  totals: {
    nprPublishedRecords: number;
    nprRecordsWithPhoto: number;
    publicJ6Profiles: number;
    exactUniqueMatches: number;
    eligiblePlaceholders: number;
    validatedImages: number;
    updatedProfiles: number;
    staleAtWrite: number;
  };
  skipped: {
    existingClearedPortrait: number;
    duplicatePublicProfileName: number;
    noExactNprMatch: number;
    duplicateNprName: number;
    noNprPhoto: number;
    namedCreditException: number;
    ineligibleVisualState: number;
    invalidRemoteImage: number;
  };
  creditExceptions: CreditException[];
  validationFailures: Array<{ name: string; url: string; reason: string }>;
};

/**
 * NPR's page gives a database-wide DOJ credit, then explicitly names these
 * exceptions. The sync fails closed if the live page introduces an unknown
 * parenthetical credit marker, so a new press/wire exception cannot silently
 * enter the archive.
 */
const CREDIT_EXCEPTIONS: CreditException[] = [
  {
    marker: "Barnett",
    name: "Richard Barnett",
    credit: "Saul Loeb/AFP via Getty Images",
  },
  {
    marker: "Beckley",
    name: "Damon Michael Beckley",
    credit: "Grayson County Detention Center",
  },
  {
    marker: "Brock",
    name: "Larry Rendall Brock",
    credit: "Grapevine Texas Police Department via AP",
  },
  {
    marker: "Bru",
    name: "Marc Anthony Bru",
    credit: "Jon Cherry/Getty Images",
  },
  {
    marker: "Chansley",
    name: "Jacob Anthony Chansley",
    credit: "Win McNamee/Getty Images",
  },
  {
    marker: "Colt",
    name: "Josiah Colt",
    credit: "Win McNamee/Getty Images",
  },
  {
    marker: "Council",
    name: "Matthew Ross Council",
    credit: "Joseph Prezioso/AFP via Getty Images",
  },
  {
    marker: "Crowl",
    name: "Donovan Ray Crowl",
    credit: "Montgomery County Jail via AP",
  },
  {
    marker: "Evans",
    name: "Derrick Evans",
    credit: "Will Price/West Virginia Legislative Photography",
  },
  {
    marker: "Gionet",
    name: "Anthime Joseph Gionet",
    credit: "Jim Bourg/Reuters",
  },
  {
    marker: "Ianni",
    name: "Suzanne Ianni",
    credit: "Joseph Prezios/AFP via Getty Images",
  },
  {
    marker: "Jensen",
    name: "Douglas Austin Jensen",
    credit: "Mike Theiler/Reuters",
  },
  {
    marker: "Adam Johnson",
    name: "Adam Christian Johnson",
    credit: "Win McNamee/Getty Images",
  },
  {
    marker: "Keller",
    name: "Klete Derik Keller",
    credit: "Thomas Kienzle/AP",
  },
  {
    marker: "Khater",
    name: "Julian Elie Khater",
    credit: "FBI",
  },
  {
    marker: "Rhodes",
    name: "Elmer Stewart Rhodes III",
    credit: "Collin County Sheriff's Office via AP",
  },
  {
    marker: "Sherrill",
    name: "Grayson Sherrill",
    credit: "Saul Loeb/AFP via Getty Images",
  },
];

const PROTECTED_RIGHTS_STATES = new Set([
  "owner-approved",
  "verified-public-domain",
  "licensed",
  "documented-editorial-use",
]);

function normalizeFullName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupByNormalizedName<T>(
  rows: T[],
  getName: (row: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = normalizeFullName(getName(row));
    if (!key) continue;
    const matches = grouped.get(key) ?? [];
    matches.push(row);
    grouped.set(key, matches);
  }
  return grouped;
}

function readAssignedJson(html: string, marker: string): unknown {
  const markerStart = html.indexOf(marker);
  if (markerStart < 0) {
    throw new Error(`NPR archive did not include ${marker.trim()}.`);
  }

  const objectStart = html.indexOf("{", markerStart + marker.length);
  if (objectStart < 0) {
    throw new Error(`NPR archive ${marker.trim()} did not include an object.`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = objectStart; index < html.length; index++) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(html.slice(objectStart, index + 1)) as unknown;
      }
    }
  }

  throw new Error(`Could not find the end of NPR archive ${marker.trim()}.`);
}

async function fetchNprSource(): Promise<{
  records: NormalizedNprJ6Record[];
  photoCreditLine: string;
  liveCreditExceptions: CreditException[];
}> {
  const response = await fetch(NPR_J6_ARCHIVE_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent": "RealRyanNichols.com conservative J6 portrait sync",
    },
  });
  if (!response.ok) {
    throw new Error(
      `NPR archive fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  const rawRecords = extractNprJ6Data(html);
  const labels = readAssignedJson(html, "window.LABELS = ") as {
    photo_source?: unknown;
  };
  const photoCreditLine =
    typeof labels.photo_source === "string" ? labels.photo_source.trim() : "";
  if (!photoCreditLine.startsWith("Department of Justice")) {
    throw new Error(
      "NPR's database-wide photo credit no longer begins with Department of Justice; refusing to sync until reviewed.",
    );
  }

  const knownByMarker = new Map(
    CREDIT_EXCEPTIONS.map((exception) => [exception.marker, exception]),
  );
  const liveMarkers = [...photoCreditLine.matchAll(/\(([^)]+)\)/g)].map(
    (match) => match[1].trim(),
  );
  const unknownMarkers = liveMarkers.filter(
    (marker) => !knownByMarker.has(marker),
  );
  if (unknownMarkers.length > 0) {
    throw new Error(
      `NPR introduced unreviewed named photo-credit exceptions: ${unknownMarkers.join(", ")}`,
    );
  }

  const liveCreditExceptions = liveMarkers.map((marker) => {
    const exception = knownByMarker.get(marker);
    if (!exception) {
      throw new Error(`Missing reviewed credit exception for ${marker}.`);
    }
    return exception;
  });

  return {
    records: rawRecords
      .map((record, index) => normalizeNprJ6Record(record, index))
      .filter((record) => record.flags.published),
    photoCreditLine,
    liveCreditExceptions,
  };
}

async function fetchAllPublicJ6Profiles(): Promise<CasePersonPortrait[]> {
  const columns = [
    "id",
    "slug",
    "name",
    "case_number",
    "visibility",
    "is_j6_defendant",
    "photo_url",
    "photo_alt_text",
    "photo_source_name",
    "photo_source_url",
    "photo_credit",
    "photo_rights_status",
    "photo_identity_status",
    "photo_verification_notes",
    "photo_verified_at",
    "photo_is_placeholder",
  ].join(", ");
  const pageSize = 1000;
  const people: CasePersonPortrait[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("case_people")
      .select(columns)
      .eq("visibility", "public")
      .eq("is_j6_defendant", true)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      throw new Error(`Could not load public J6 profiles: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    people.push(...(data as unknown as CasePersonPortrait[]));
    if (data.length < pageSize) break;
  }

  return people;
}

function isProtectedPortrait(person: CasePersonPortrait): boolean {
  return Boolean(
    person.photo_url &&
      !person.photo_is_placeholder &&
      person.photo_identity_status === "verified" &&
      person.photo_verified_at &&
      person.photo_rights_status &&
      PROTECTED_RIGHTS_STATES.has(person.photo_rights_status),
  );
}

function isEligiblePlaceholder(person: CasePersonPortrait): boolean {
  return (
    person.photo_is_placeholder === true &&
    person.photo_rights_status === "portrait-needed" &&
    person.photo_identity_status === "placeholder"
  );
}

function assertExpectedNprImageUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.origin !== NPR_IMAGE_ORIGIN ||
    !url.pathname.startsWith(NPR_IMAGE_PATH_PREFIX)
  ) {
    throw new Error("asset URL is outside NPR's reviewed J6 image path");
  }
  return url;
}

function hasMatchingImageSignature(
  bytes: Uint8Array,
  contentType: string,
): boolean {
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (contentType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

async function validateRemoteImage(
  candidate: PortraitCandidate,
): Promise<ValidationResult> {
  const url = candidate.record.photoUrl;
  if (!url) {
    return {
      ok: false,
      name: candidate.person.name,
      url: "",
      reason: "NPR record has no image URL",
    };
  }

  try {
    assertExpectedNprImageUrl(url);
    let lastError = "unknown remote-image validation error";

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          redirect: "follow",
          signal: controller.signal,
          headers: {
            Accept: "image/jpeg,image/png,image/webp",
            Range: "bytes=0-511",
            "User-Agent": "RealRyanNichols.com conservative J6 portrait sync",
          },
        });
        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          continue;
        }

        const contentType = (response.headers.get("content-type") ?? "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
          lastError = `unsupported content-type ${contentType || "(missing)"}`;
          continue;
        }

        const contentLength = Number.parseInt(
          response.headers.get("content-length") ?? "",
          10,
        );
        if (
          Number.isFinite(contentLength) &&
          contentLength > MAX_IMAGE_BYTES
        ) {
          lastError = `image response exceeds ${MAX_IMAGE_BYTES} bytes`;
          continue;
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length < 12) {
          lastError = "image response was too short";
          continue;
        }
        if (!hasMatchingImageSignature(bytes, contentType)) {
          lastError = `file signature does not match ${contentType}`;
          continue;
        }

        return {
          ok: true,
          candidate: {
            ...candidate,
            validation: {
              contentType,
              httpStatus: response.status,
              validatedAt: new Date().toISOString(),
            },
          },
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "remote fetch failed";
      } finally {
        clearTimeout(timeout);
      }
    }

    return {
      ok: false,
      name: candidate.person.name,
      url,
      reason: lastError,
    };
  } catch (error) {
    return {
      ok: false,
      name: candidate.person.name,
      url,
      reason: error instanceof Error ? error.message : "invalid image URL",
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(1, items.length)) },
      () => worker(),
    ),
  );
  return results;
}

function portraitPatch(candidate: ValidatedCandidate): Record<string, unknown> {
  const { person, record, validation } = candidate;
  return {
    photo_url: record.photoUrl,
    photo_alt_text: `${person.name} profile photograph from NPR's January 6 archive`,
    photo_source_name:
      "NPR The Capitol Charges / U.S. Department of Justice",
    photo_source_url: NPR_J6_ARCHIVE_URL,
    photo_credit:
      "NPR's The Capitol Charges; database photo credit: Department of Justice (all named credit exceptions excluded)",
    photo_rights_status: "documented-editorial-use",
    photo_identity_status: "verified",
    photo_verification_notes: [
      "Identity: exact unique normalized full-name match between this public J6 profile and one published NPR archive record.",
      `Remote asset validated ${validation.validatedAt} with HTTP ${validation.httpStatus}, ${validation.contentType}, and a matching file signature.`,
      "Source: NPR's database-wide credit line attributes non-exception photographs to the Department of Justice; this sync excludes every separately named source in that credit line.",
      "Rights: documented editorial use only; this is not a public-domain or license determination.",
      "The low-resolution NPR source asset remains externally hosted and is not altered or re-encoded by this sync.",
    ].join(" "),
    photo_verified_at: validation.validatedAt,
    photo_is_placeholder: false,
  };
}

async function applyValidatedCandidates(
  candidates: ValidatedCandidate[],
): Promise<{ updated: number; stale: number }> {
  let updated = 0;
  let stale = 0;

  for (let offset = 0; offset < candidates.length; offset += UPDATE_BATCH_SIZE) {
    const batch = candidates.slice(offset, offset + UPDATE_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (candidate) => {
        const { data, error } = await supabase
          .from("case_people")
          .update(portraitPatch(candidate))
          .eq("id", candidate.person.id)
          .eq("visibility", "public")
          .eq("is_j6_defendant", true)
          .eq("photo_is_placeholder", true)
          .eq("photo_rights_status", "portrait-needed")
          .eq("photo_identity_status", "placeholder")
          .select("id");
        if (error) {
          throw new Error(
            `Portrait update failed for ${candidate.person.name}: ${error.message}`,
          );
        }
        return (data?.length ?? 0) === 1;
      }),
    );

    updated += results.filter(Boolean).length;
    stale += results.filter((didUpdate) => !didUpdate).length;
    console.log(
      `Applied ${Math.min(offset + batch.length, candidates.length)}/${candidates.length} validated portrait updates.`,
    );
  }

  return { updated, stale };
}

async function writeSummary(summary: SyncSummary): Promise<void> {
  if (!SUMMARY_PATH) return;
  await mkdir(dirname(SUMMARY_PATH), { recursive: true });
  await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Summary written to ${SUMMARY_PATH}`);
}

async function main() {
  if (APPLY && args.has("--dry-run")) {
    throw new Error("Choose either --apply or --dry-run, not both.");
  }

  const [{ records, photoCreditLine, liveCreditExceptions }, people] =
    await Promise.all([fetchNprSource(), fetchAllPublicJ6Profiles()]);
  const nprByName = groupByNormalizedName(records, (record) => record.name);
  const peopleByName = groupByNormalizedName(people, (person) => person.name);
  const exceptionNames = new Set(
    liveCreditExceptions.map((exception) =>
      normalizeFullName(exception.name),
    ),
  );

  const skipped: SyncSummary["skipped"] = {
    existingClearedPortrait: 0,
    duplicatePublicProfileName: 0,
    noExactNprMatch: 0,
    duplicateNprName: 0,
    noNprPhoto: 0,
    namedCreditException: 0,
    ineligibleVisualState: 0,
    invalidRemoteImage: 0,
  };
  const candidates: PortraitCandidate[] = [];
  let exactUniqueMatches = 0;

  for (const person of people) {
    if (isProtectedPortrait(person)) {
      skipped.existingClearedPortrait++;
      continue;
    }

    const normalizedName = normalizeFullName(person.name);
    if ((peopleByName.get(normalizedName)?.length ?? 0) !== 1) {
      skipped.duplicatePublicProfileName++;
      continue;
    }

    const nprMatches = nprByName.get(normalizedName);
    if (!nprMatches || nprMatches.length === 0) {
      skipped.noExactNprMatch++;
      continue;
    }
    if (nprMatches.length !== 1) {
      skipped.duplicateNprName++;
      continue;
    }
    exactUniqueMatches++;

    if (exceptionNames.has(normalizedName)) {
      skipped.namedCreditException++;
      continue;
    }

    const record = nprMatches[0];
    if (!record.photoUrl) {
      skipped.noNprPhoto++;
      continue;
    }
    if (!isEligiblePlaceholder(person)) {
      skipped.ineligibleVisualState++;
      continue;
    }
    candidates.push({ person, record });
  }

  console.log(
    [
      `Mode=${APPLY ? "apply" : "dry-run"}`,
      `publicJ6=${people.length}`,
      `nprPublished=${records.length}`,
      `exactUnique=${exactUniqueMatches}`,
      `eligible=${candidates.length}`,
    ].join(" "),
  );
  console.log(
    "Rights semantics: documented editorial use only; no public-domain or license claim.",
  );

  const validationResults = await mapWithConcurrency(
    candidates,
    VALIDATION_CONCURRENCY,
    validateRemoteImage,
  );
  const validated = validationResults
    .filter(
      (result): result is Extract<ValidationResult, { ok: true }> => result.ok,
    )
    .map((result) => result.candidate);
  const validationFailures = validationResults
    .filter(
      (result): result is Extract<ValidationResult, { ok: false }> => !result.ok,
    )
    .map(({ name, url, reason }) => ({ name, url, reason }));
  skipped.invalidRemoteImage = validationFailures.length;

  let updated = 0;
  let stale = 0;
  if (APPLY) {
    ({ updated, stale } = await applyValidatedCandidates(validated));
  }

  const summary: SyncSummary = {
    mode: APPLY ? "apply" : "dry-run",
    generatedAt: new Date().toISOString(),
    sourceUrl: NPR_J6_ARCHIVE_URL,
    sourcePhotoCreditLine: photoCreditLine,
    semantics:
      "Exact unique normalized full-name matches; remote low-resolution image; documented editorial use only; no public-domain or license claim.",
    totals: {
      nprPublishedRecords: records.length,
      nprRecordsWithPhoto: records.filter((record) => record.photoUrl).length,
      publicJ6Profiles: people.length,
      exactUniqueMatches,
      eligiblePlaceholders: candidates.length,
      validatedImages: validated.length,
      updatedProfiles: updated,
      staleAtWrite: stale,
    },
    skipped,
    creditExceptions: liveCreditExceptions,
    validationFailures,
  };

  await writeSummary(summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
