export const NPR_J6_ARCHIVE_URL =
  "https://apps.npr.org/jan-6-archive/database.html";

export const NPR_J6_ASSET_BASE =
  "https://apps.npr.org/jan-6-archive/assets/synced/images/database";

export type NprJ6Record = {
  last: string;
  first: string;
  middle?: string;
  publish?: string;
  new?: string;
  updated?: string;
  summary?: string;
  jurisdiction?: string;
  charges?: string;
  charges_link?: string;
  case_status?: string;
  case_updates?: string;
  violence_assault?: string;
  conspiracy?: string;
  theft?: string;
  property?: string;
  age?: number | string;
  city?: string;
  state?: string;
  military?: string;
  law_enforcement?: string;
  extremist?: string;
  inspired_trump?: string;
  sentenced?: string;
  commuted?: string;
  pardoned?: string;
  arrest_dates?: string;
  photo_name?: string;
  video?: string;
};

export type NormalizedNprJ6Record = {
  sourceId: string;
  name: string;
  slug: string;
  location: string | null;
  charges: string[];
  arrestDates: string[];
  firstArrestDate: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  chargesLink: string | null;
  courtlistenerDocketId: string | null;
  flags: Record<string, boolean>;
  raw: NprJ6Record;
};

export async function fetchNprJ6Archive(): Promise<NprJ6Record[]> {
  const res = await fetch(NPR_J6_ARCHIVE_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent": "RealRyanNichols.com J6 archive importer",
    },
  });
  if (!res.ok) {
    throw new Error(`NPR archive fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return extractNprJ6Data(html);
}

export function extractNprJ6Data(html: string): NprJ6Record[] {
  const marker = "window.DATA = ";
  const markerStart = html.indexOf(marker);
  if (markerStart < 0) {
    throw new Error("NPR archive did not include window.DATA.");
  }

  const arrayStart = html.indexOf("[", markerStart + marker.length);
  if (arrayStart < 0) {
    throw new Error("NPR archive window.DATA did not include an array.");
  }

  const arrayEnd = findJsonArrayEnd(html, arrayStart);
  const json = html.slice(arrayStart, arrayEnd);
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("NPR archive window.DATA was not an array.");
  }
  return parsed as NprJ6Record[];
}

export function normalizeNprJ6Record(
  record: NprJ6Record,
  index: number,
): NormalizedNprJ6Record {
  const name = cleanSpaces(
    [record.first, record.middle, record.last].filter(Boolean).join(" "),
  );
  const slug = slugify(name);
  const docketId = extractCourtlistenerDocketId(record.charges_link ?? "");
  const charges = splitList(record.charges, ";");
  const arrestDates = splitList(record.arrest_dates, /[,;]/).map(normalizeUsDate);
  const fallbackId = [slug, arrestDates[0], index + 1].filter(Boolean).join("-");
  const sourceId = `npr-j6-${docketId ? `${slug}-${docketId}` : fallbackId}`;

  return {
    sourceId,
    name,
    slug,
    location: cleanSpaces([record.city, record.state].filter(Boolean).join(", ")) || null,
    charges,
    arrestDates,
    firstArrestDate: arrestDates[0] ?? null,
    photoUrl: record.photo_name
      ? `${NPR_J6_ASSET_BASE}/${encodeURIComponent(record.photo_name)}`
      : null,
    videoUrl: cleanUrl(record.video),
    chargesLink: cleanUrl(record.charges_link),
    courtlistenerDocketId: docketId,
    flags: {
      violence_assault: isYes(record.violence_assault),
      conspiracy: isYes(record.conspiracy),
      theft: isYes(record.theft),
      property: isYes(record.property),
      military: isYes(record.military),
      law_enforcement: isYes(record.law_enforcement),
      extremist: isYes(record.extremist),
      inspired_trump: isYes(record.inspired_trump),
      sentenced: isYes(record.sentenced),
      commuted: isYes(record.commuted),
      pardoned: isYes(record.pardoned),
      published: isYes(record.publish),
      new_or_updated: isYes(record.new) || isYes(record.updated),
    },
    raw: record,
  };
}

export function buildNprImportDescription(record: NormalizedNprJ6Record): string {
  const parts = [
    record.raw.summary ? `NPR summary:\n${record.raw.summary.trim()}` : null,
    record.raw.case_updates
      ? `Case updates:\n${record.raw.case_updates.trim()}`
      : null,
    record.charges.length > 0
      ? `Charges listed by NPR:\n${record.charges.join("\n")}`
      : null,
    record.location ? `Location listed by NPR: ${record.location}` : null,
    record.raw.age ? `Age listed by NPR at charge date: ${record.raw.age}` : null,
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, 1800);
}

function findJsonArrayEnd(input: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }

  throw new Error("Could not find the end of NPR archive window.DATA.");
}

function splitList(value: string | undefined, separator: string | RegExp): string[] {
  return (value ?? "")
    .split(separator)
    .map((v) => cleanSpaces(v))
    .filter(Boolean);
}

function cleanSpaces(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function cleanUrl(value: string | undefined): string | null {
  const clean = cleanSpaces(value);
  return clean && /^https?:\/\//i.test(clean) ? clean : null;
}

function isYes(value: string | undefined): boolean {
  return cleanSpaces(value).toUpperCase() === "Y";
}

function normalizeUsDate(value: string): string {
  const clean = cleanSpaces(value);
  const m = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return clean;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function extractCourtlistenerDocketId(url: string): string | null {
  const match = url.match(/gov\.uscourts\.dcd\.(\d+)/);
  return match?.[1] ?? null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
