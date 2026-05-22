import { NextResponse } from "next/server";
import { z } from "zod";
import { requireJ6Owner } from "@/lib/j6-ownership";

const schema = z.object({
  person_id: z.string().uuid(),
  url: z.string().url().max(2000),
  title: z.string().min(1).max(200),
  caption: z.string().max(2000).nullable().optional(),
});

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "embed"
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
  const own = await requireJ6Owner(parsed.data.person_id);
  if (!own.ok) {
    return NextResponse.json({ error: own.error }, { status: own.status });
  }

  const slug =
    `${own.person.slug}-${Date.now()}-${slugify(parsed.data.title)}`.slice(0, 120);
  const { data: inserted, error: insErr } = await own.supabase
    .from("case_documents")
    .insert({
      slug,
      title: parsed.data.title.trim(),
      description: parsed.data.caption?.trim() || null,
      doc_type: "other",
      media_kind: "video_embed",
      embed_url: parsed.data.url.trim(),
      external_url: parsed.data.url.trim(),
      author_role: "other",
      submitted_by_user_id: own.userId,
      submission_status: "pending",
      visibility: "public",
    })
    .select("id")
    .maybeSingle();
  if (insErr || !inserted) {
    return NextResponse.json(
      { error: `Save failed: ${insErr?.message ?? "no row"}` },
      { status: 500 },
    );
  }

  await own.supabase.from("case_doc_person").insert({
    document_id: inserted.id,
    person_id: own.person.id,
    role: "submitted_by",
  });

  return NextResponse.json({ ok: true, id: inserted.id });
}
