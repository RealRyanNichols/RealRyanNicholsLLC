import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  doc_type: z
    .enum([
      "filing",
      "court_order",
      "motion",
      "letter",
      "exhibit",
      "media",
      "evidence",
      "transcript",
      "discovery",
      "presidential",
      "other",
    ])
    .optional(),
  document_date: z.string().nullable().optional(),
  relevance: z.number().int().min(0).max(5).optional(),
  transcript: z.string().max(20000).nullable().optional(),
  archived: z.boolean().optional(),
  archived_reason: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { slug, ...fields } = parsed.data;
  const update: Record<string, unknown> = { ...fields, curated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("case_documents")
    .update(update)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
