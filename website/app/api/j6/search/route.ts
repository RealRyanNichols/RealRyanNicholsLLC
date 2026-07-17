import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

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
      "slug, name, role, case_number, claim_status, description, photo_url",
      { count: "exact" },
    )
    .eq("visibility", "public")
    .eq("is_j6_defendant", true)
    .or(`name.ilike.${like},case_number.ilike.${like},role.ilike.${like}`)
    .order("name", { ascending: true })
    .limit(12);

  const results = (data ?? []).map((p) => ({
    slug: p.slug,
    name: p.name,
    role: p.role,
    case_number: p.case_number,
    claim_status: p.claim_status,
    // A short teaser only — the full story lives on the profile page.
    blurb: (p.description ?? "").replace(/\s+/g, " ").trim().slice(0, 140),
    has_photo: Boolean(p.photo_url),
  }));

  return NextResponse.json(
    { results, total: count ?? results.length },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
