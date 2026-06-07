import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { detectVideo } from "@/lib/video";

// One-click: turn a private tip into a case-document (exhibit). Created PRIVATE
// and pending on purpose — it lands in the evidence workspace for verification,
// never straight to the public archive.
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tip-evidence"
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
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
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Storage not configured." }, { status: 503 });
  }

  const svc = getSupabaseServiceClient();
  const { data: tip } = await svc
    .from("case_tips")
    .select("id, defendant_name, category, location, urls")
    .eq("id", id)
    .maybeSingle();
  if (!tip) {
    return NextResponse.json({ error: "Tip not found." }, { status: 404 });
  }

  const t = tip as {
    defendant_name?: string | null;
    category?: string | null;
    location?: string | null;
    urls?: string[] | null;
  };
  const urls = Array.isArray(t.urls)
    ? t.urls.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))
    : [];
  const firstUrl = urls[0] ?? null;
  const title = String(
    t.defendant_name || t.category || "Tip evidence",
  ).slice(0, 200);
  const video = firstUrl ? detectVideo(firstUrl) : null;
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const description = [
    t.location ? `Location: ${t.location}.` : null,
    t.category ? `Category: ${t.category}.` : null,
    "Filed from a private tip — verify before making public.",
  ]
    .filter(Boolean)
    .join(" ");

  const { data: inserted, error } = await svc
    .from("case_documents")
    .insert({
      slug,
      title,
      description,
      external_url: firstUrl,
      embed_url: video?.embedUrl ?? null,
      doc_type: video ? "video" : "other",
      media_kind: "document",
      visibility: "private",
      submission_status: "pending",
      source: "Private tip intake",
    })
    .select("slug")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not save evidence." }, { status: 500 });
  }

  // Mark the tip as mapped so the board reflects the action.
  await svc
    .from("case_tips")
    .update({
      outcome_status: "case_mapped",
      outcome_at: new Date().toISOString(),
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ ok: true, slug: inserted?.slug ?? slug });
}
