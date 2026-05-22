import { NextResponse } from "next/server";
import { z } from "zod";
import { requireJ6Owner } from "@/lib/j6-ownership";

// ISO date string (YYYY-MM-DD) or empty/null. Stored as date in PG.
const dateField = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
  .nullable()
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

const textField = z
  .string()
  .max(500)
  .nullable()
  .optional()
  .transform((v) => (v == null ? null : v.trim() || null));

const urlField = z
  .union([z.string().url().max(500), z.literal("")])
  .nullable()
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

// One charge / news link per line, trimmed, empty lines dropped.
const linesToArray = (s: unknown) => {
  if (typeof s !== "string") return null;
  const lines = s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines : null;
};

const schema = z.object({
  person_id: z.string().uuid(),
  case_number: textField,
  court: textField,
  judge_name: textField,
  prosecutor_name: textField,
  defense_attorney: textField,
  arrest_date: dateField,
  plea_date: dateField,
  sentence_date: dateField,
  sentence_summary: z
    .string()
    .max(5000)
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : v.trim() || null)),
  disposition: textField,
  // Frontend sends one-per-line text; we split server-side.
  charges_raw: z.string().max(5000).optional(),
  news_links_raw: z.string().max(5000).optional(),
  support_url: urlField,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const own = await requireJ6Owner(parsed.data.person_id);
  if (!own.ok) {
    return NextResponse.json({ error: own.error }, { status: own.status });
  }

  const charges = linesToArray(parsed.data.charges_raw);
  const news_links = linesToArray(parsed.data.news_links_raw);

  const patch = {
    case_number: parsed.data.case_number,
    court: parsed.data.court,
    judge_name: parsed.data.judge_name,
    prosecutor_name: parsed.data.prosecutor_name,
    defense_attorney: parsed.data.defense_attorney,
    arrest_date: parsed.data.arrest_date,
    plea_date: parsed.data.plea_date,
    sentence_date: parsed.data.sentence_date,
    sentence_summary: parsed.data.sentence_summary,
    disposition: parsed.data.disposition,
    charges,
    news_links,
    support_url: parsed.data.support_url,
  };

  const { error } = await own.supabase
    .from("case_people")
    .update(patch)
    .eq("id", own.person.id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Could not save." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
