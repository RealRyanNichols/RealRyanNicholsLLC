import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Promotes a pending_imports row into a real case_documents row and
// links it to the suggested person. Admin only.

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

  const { data: pending, error: pErr } = await supabase
    .from("pending_imports")
    .select(
      "id, title, description, doc_type, document_date, external_url, file_url, source_label, person_id, review_status",
    )
    .eq("id", id)
    .maybeSingle();
  if (pErr || !pending) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (pending.review_status !== "pending") {
    return NextResponse.json(
      { error: `Already ${pending.review_status}.` },
      { status: 409 },
    );
  }

  // Build a slug for the public document. Court Listener URLs include
  // a stable doc id we can hang onto; collisions get a -n suffix.
  const base = (pending.title ?? "imported-document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  let slug = base || "imported-document";
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data: existing } = await supabase
      .from("case_documents")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${attempt + 2}`;
  }

  const docInsert = {
    slug,
    title: pending.title,
    description: pending.description,
    doc_type: pending.doc_type ?? "other",
    document_date: pending.document_date,
    file_url: pending.file_url,
    external_url: pending.external_url,
    source: pending.source_label,
    visibility: "public",
    author_role: "court",
    media_kind: pending.doc_type === "photo" ? "image" : "document",
    relevance: 3,
    submission_status: "approved",
  };

  const { data: doc, error: docErr } = await supabase
    .from("case_documents")
    .insert(docInsert)
    .select("id")
    .single();
  if (docErr || !doc) {
    return NextResponse.json(
      { error: docErr?.message ?? "Could not create document." },
      { status: 500 },
    );
  }

  if (pending.person_id) {
    const { error: linkErr } = await supabase
      .from("case_doc_person")
      .insert({ document_id: doc.id, person_id: pending.person_id });
    if (linkErr && linkErr.code !== "23505") {
      // ignore duplicate link, surface anything else
      return NextResponse.json(
        { error: `Linked failed: ${linkErr.message}` },
        { status: 500 },
      );
    }
  }

  const { error: updErr } = await supabase
    .from("pending_imports")
    .update({
      review_status: "approved",
      reviewed_by_user_id: auth.user.id,
      reviewed_at: new Date().toISOString(),
      case_document_id: doc.id,
    })
    .eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document_id: doc.id });
}
