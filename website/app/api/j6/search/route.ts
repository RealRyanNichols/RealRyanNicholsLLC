import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { isClearedJ6Portrait } from "@/lib/j6-portrait";

export const runtime = "nodejs";
export const revalidate = 0;

// Find Your Case — public defendant lookup across ALL claim statuses.
// (getJ6PeoplePage filters by one status; this is the search box that answers
// "am I in here?" in one query.) Anon client → RLS applies; only public,
// J6-flagged rows can ever come back.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "")
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const supabase = getSupabaseStaticClient();
  const like = `%${q}%`;
  const { data, count } = await supabase
    .from("case_people")
    .select(
      "slug, name, role, case_number, claim_status, description, photo_url, photo_is_placeholder, photo_identity_status, photo_rights_status, photo_verified_at",
      { count: "exact" },
    )
    .eq("visibility", "public")
    .eq("is_j6_defendant", true)
    .or(`name.ilike.${like},case_number.ilike.${like},role.ilike.${like}`)
    .order("name", { ascending: true })
    .limit(12);

  const results = (data ?? []).map((p) => {
    const hasClearedPortrait = isClearedJ6Portrait(p);
    return {
      slug: p.slug,
      name: p.name,
      role: p.role,
      case_number: p.case_number,
      claim_status: p.claim_status,
      // A short teaser only — the full story lives on the profile page.
      blurb: (p.description ?? "").replace(/\s+/g, " ").trim().slice(0, 140),
      image_url: hasClearedPortrait
        ? p.photo_url
        : `/api/j6/profile-image/${p.slug}`,
      image_kind: hasClearedPortrait ? "portrait" : "archive-card",
    };
  });

  return NextResponse.json(
    { results, total: count ?? results.length },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
