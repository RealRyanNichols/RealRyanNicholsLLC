import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { pingIndexNow } from "@/lib/indexnow";

// Manual IndexNow submission — admin only. Publishing paths call
// pingIndexNow() directly; this endpoint exists for backfills and
// hand-submitting changed URLs.
export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { urls?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((u): u is string => typeof u === "string")
    : [];
  if (urls.length === 0) {
    return NextResponse.json({ error: "urls[] required." }, { status: 400 });
  }

  await pingIndexNow(urls);
  return NextResponse.json({ ok: true, submitted: Math.min(urls.length, 100) });
}
