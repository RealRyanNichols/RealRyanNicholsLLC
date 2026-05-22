import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { scoreEvidence } from "@/lib/courtlistener";

// One-stop admin endpoint for capturing evidence from anywhere — tweets,
// news articles, congressional videos, blog posts, podcasts. Anywhere
// Ryan reads/sees something worth locking into the case log. Skips the
// pending_imports review queue because this is admin-curated.

const DOC_TYPES = [
  "motion","order","ruling","transcript","indictment","affidavit",
  "docket","exhibit","discovery","grievance_form","letter","email",
  "photo","audio","video","spreadsheet","article","other",
] as const;
const AUTHOR_ROLES = [
  "ryan","co_detainee","attorney","court","government",
  "family","media","evidence","other",
] as const;
const ALL_THEMES = [
  "entrapment","excessive_force","death_or_injury","police_misconduct",
  "government_lies","contradiction","due_process","abuse_in_custody",
];

const schema = z.object({
  url: z.string().url().max(1000).optional().nullable(),
  title: z.string().min(2).max(250),
  body: z.string().max(20000).optional().nullable(),
  source_label: z.string().max(250).optional().nullable(),
  document_date: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .nullable()
    .optional(),
  doc_type: z.enum(DOC_TYPES).default("article"),
  author_role: z.enum(AUTHOR_ROLES).default("evidence"),
  thumbnail_url: z.string().url().max(1000).optional().nullable(),
  person_slug: z.string().max(200).optional().nullable(),
  event_slug: z.string().max(200).optional().nullable(),
  grievance_slugs: z.string().max(1000).optional().nullable(),
  themes: z.array(z.string()).optional().default([]),
  importance_override: z
    .number()
    .int()
    .min(0)
    .max(20)
    .optional()
    .nullable(),
  relevance: z.number().int().min(0).max(5).default(3),
});

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "evidence"
  );
}

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

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const data = parsed.data;

  // Resolve slugs to IDs. Slug not found = silent skip (admin can fix
  // later) rather than failing the whole submission.
  let personId: string | null = null;
  if (data.person_slug?.trim()) {
    const { data: p } = await supabase
      .from("case_people")
      .select("id")
      .eq("slug", data.person_slug.trim())
      .maybeSingle();
    personId = p?.id ?? null;
  }
  let eventId: string | null = null;
  if (data.event_slug?.trim()) {
    const { data: e } = await supabase
      .from("case_events")
      .select("id")
      .eq("slug", data.event_slug.trim())
      .maybeSingle();
    eventId = e?.id ?? null;
  }
  const grievanceSlugs = (data.grievance_slugs ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let grievanceIds: string[] = [];
  if (grievanceSlugs.length > 0) {
    const { data: gs } = await supabase
      .from("case_grievances")
      .select("id, slug")
      .in("slug", grievanceSlugs);
    grievanceIds = (gs ?? []).map((g) => g.id);
  }

  // Build a unique slug for the document.
  const base = slugify(data.title);
  let slug = base;
  for (let i = 0; i < 30; i++) {
    const { data: existing } = await supabase
      .from("case_documents")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${i + 2}`;
  }

  // Auto-score themes against the body text, then merge with any
  // manually-selected themes from the form.
  const scoreText = [data.title, data.body, data.source_label]
    .filter(Boolean)
    .join(" · ");
  const auto = scoreEvidence(scoreText);
  const themeSet = new Set<string>([
    ...auto.themes,
    ...(data.themes ?? []).filter((t) => ALL_THEMES.includes(t)),
  ]);
  const themes = [...themeSet];

  const docInsert: Record<string, unknown> = {
    slug,
    title: data.title,
    description: data.body ?? null,
    doc_type: data.doc_type,
    external_url: data.url ?? null,
    file_url: data.thumbnail_url ?? null,
    document_date:
      data.document_date && data.document_date.length > 0
        ? data.document_date
        : null,
    source: data.source_label ?? null,
    visibility: "public",
    author_role: data.author_role,
    media_kind:
      data.doc_type === "photo"
        ? "image"
        : data.doc_type === "video"
          ? "video_embed"
          : "document",
    relevance: data.relevance,
    submission_status: "approved",
  };

  const { data: doc, error: docErr } = await supabase
    .from("case_documents")
    .insert(docInsert)
    .select("id, slug")
    .single();
  if (docErr || !doc) {
    return NextResponse.json(
      { error: docErr?.message ?? "Could not create document." },
      { status: 500 },
    );
  }

  // Link rows. Ignore duplicate errors; surface everything else.
  if (personId) {
    const { error } = await supabase
      .from("case_doc_person")
      .insert({ document_id: doc.id, person_id: personId });
    if (error && error.code !== "23505") {
      return NextResponse.json(
        { error: `person link: ${error.message}` },
        { status: 500 },
      );
    }
  }
  if (eventId) {
    const { error } = await supabase
      .from("case_doc_event")
      .insert({ document_id: doc.id, event_id: eventId });
    if (error && error.code !== "23505") {
      return NextResponse.json(
        { error: `event link: ${error.message}` },
        { status: 500 },
      );
    }
  }
  for (const gid of grievanceIds) {
    const { error } = await supabase
      .from("case_doc_grievance")
      .insert({ document_id: doc.id, grievance_id: gid });
    if (error && error.code !== "23505") {
      return NextResponse.json(
        { error: `grievance link: ${error.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    document_id: doc.id,
    slug: doc.slug,
    public_url: `/case/documents/${doc.slug}`,
    themes,
    importance: auto.importance + (data.importance_override ?? 0),
    linked: {
      person: !!personId,
      event: !!eventId,
      grievances: grievanceIds.length,
    },
  });
}
