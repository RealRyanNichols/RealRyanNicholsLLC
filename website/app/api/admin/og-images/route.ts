import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  const file = form.get("file") as File | null;
  const path = String(form.get("path") ?? "").trim();
  const title = String(form.get("title") ?? "").trim() || null;
  const description = String(form.get("description") ?? "").trim() || null;

  if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (!path) return NextResponse.json({ error: "Path is required." }, { status: 400 });
  if (!path.startsWith("/")) {
    return NextResponse.json(
      { error: "Path must start with '/'. e.g. /case?view=people&filter=unclaimed" },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Use PNG, JPEG, WEBP, or GIF.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${Math.round(file.size / 1024)}KB). Max 8MB.` },
      { status: 400 },
    );
  }

  // Slugify the path so it works as a storage key
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeKey = path.replace(/[^a-zA-Z0-9-_=&?/]/g, "_").replace(/\//g, "__");
  const storagePath = `og-images/${Date.now()}-${safeKey}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadErr } = await supabase.storage
    .from("case-media")
    .upload(storagePath, bytes, {
      contentType: file.type,
      cacheControl: "604800",
      upsert: false,
    });
  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }
  const { data: pub } = supabase.storage.from("case-media").getPublicUrl(storagePath);
  const image_url = pub.publicUrl;

  const { error: dbErr } = await supabase
    .from("page_og_images")
    .upsert(
      {
        path,
        image_url,
        title,
        description,
        updated_by: auth.user.id,
      },
      { onConflict: "path" },
    );
  if (dbErr) {
    return NextResponse.json({ error: `Save failed: ${dbErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path, image_url });
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const path =
    typeof body === "object" && body && "path" in body
      ? String((body as { path: unknown }).path).trim()
      : "";
  if (!path) return NextResponse.json({ error: "Path required." }, { status: 400 });

  const { error } = await supabase.from("page_og_images").delete().eq("path", path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
