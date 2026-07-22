import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Sign in before submitting a write-in." }, { status: 401 });
  }
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Confirm your email address before submitting a write-in." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 3 || name.length > 120) {
    return NextResponse.json({ error: "Enter a full name between 3 and 120 characters." }, { status: 400 });
  }
  if (!/^[\p{L}\p{M}0-9 .,'"()\-&]+$/u.test(name)) {
    return NextResponse.json({ error: "The write-in name contains unsupported characters." }, { status: 400 });
  }

  const { data: candidateId, error } = await supabase.rpc("nominate_j6_top25_write_in", {
    p_name: name,
  });
  if (error || !candidateId) {
    return NextResponse.json(
      { error: error?.message || "The write-in could not be submitted." },
      { status: 400 }
    );
  }

  const { data: row, error: rowError } = await supabase
    .from("j6_top25_candidates")
    .select("id,slug,display_name,aliases,seed_rank,is_seeded,case_person_id,editorial_note,case_people(slug,photo_url,role)")
    .eq("id", candidateId)
    .single();

  if (rowError || !row) {
    return NextResponse.json({ error: "The write-in was saved but could not be reloaded." }, { status: 500 });
  }

  const profile = Array.isArray((row as any).case_people)
    ? (row as any).case_people[0]
    : (row as any).case_people;

  return NextResponse.json({
    ok: true,
    candidate: {
      id: row.id,
      slug: row.slug,
      display_name: row.display_name,
      aliases: row.aliases,
      seed_rank: row.seed_rank,
      is_seeded: row.is_seeded,
      case_person_id: row.case_person_id,
      editorial_note: row.editorial_note,
      vote_count: 1,
      profile_slug: profile?.slug ?? null,
      photo_url: profile?.photo_url ?? null,
      role: profile?.role ?? null,
    },
  });
}
