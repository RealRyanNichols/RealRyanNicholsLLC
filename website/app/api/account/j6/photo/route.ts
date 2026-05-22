import { NextResponse } from "next/server";
import { requireJ6Owner } from "@/lib/j6-ownership";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "photo"
  );
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form." }, { status: 400 });
  }
  const personId = String(form.get("person_id") ?? "");
  const own = await requireJ6Owner(personId);
  if (!own.ok) {
    return NextResponse.json({ error: own.error }, { status: own.status });
  }

  const file = form.get("file") as File | null;
  const title = String(form.get("title") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim() || null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (>10MB)." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "png")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const storagePath = `j6-uploads/${own.person.slug}/${Date.now()}-${slugify(title)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error: upErr } = await own.supabase.storage
    .from("case-media")
    .upload(storagePath, bytes, {
      contentType: file.type,
      cacheControl: "604800",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json(
      { error: `Upload failed: ${upErr.message}` },
      { status: 500 },
    );
  }
  const { data: pub } = own.supabase.storage
    .from("case-media")
    .getPublicUrl(storagePath);
  const fileUrl = pub.publicUrl;

  const slug = `${own.person.slug}-${Date.now()}-${slugify(title)}`.slice(0, 120);

  const { data: inserted, error: insErr } = await own.supabase
    .from("case_documents")
    .insert({
      slug,
      title,
      description: caption,
      doc_type: "other",
      media_kind: "image",
      file_url: fileUrl,
      file_mime: file.type,
      file_size_bytes: file.size,
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

  // Link the document to this defendant's profile.
  await own.supabase.from("case_doc_person").insert({
    document_id: inserted.id,
    person_id: own.person.id,
    role: "submitted_by",
  });

  return NextResponse.json({ ok: true, id: inserted.id });
}
