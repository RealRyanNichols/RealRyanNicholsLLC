import { NextResponse } from "next/server";
import { requireJ6Owner } from "@/lib/j6-ownership";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

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
  if (form.get("publication_rights_attested") !== "true") {
    return NextResponse.json(
      { error: "Confirm that you own the photograph or may publish it." },
      { status: 400 },
    );
  }
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (>5MB)." }, { status: 400 });
  }
  const ext = (file.name.split(".").pop() || "png")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const storagePath = `j6-avatars/${own.person.slug}-${Date.now()}.${ext}`;
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
  const verifiedAt = new Date().toISOString();
  const { error: updErr } = await own.supabase
    .from("case_people")
    .update({
      photo_url: pub.publicUrl,
      photo_alt_text: `${own.person.name} profile photograph in the January 6 case archive`,
      photo_source_name: `${own.person.name} (verified profile owner)`,
      photo_source_url: pub.publicUrl,
      photo_credit: "Owner-supplied photograph",
      photo_rights_status: "owner-approved",
      photo_identity_status: "verified",
      photo_verification_notes:
        "Uploaded and approved for publication by the verified owner of this profile.",
      photo_verified_at: verifiedAt,
      photo_is_placeholder: false,
    })
    .eq("id", own.person.id);
  if (updErr) {
    return NextResponse.json(
      { error: `Save failed: ${updErr.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
