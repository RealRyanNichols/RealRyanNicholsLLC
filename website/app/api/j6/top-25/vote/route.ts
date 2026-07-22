import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Sign in before voting." }, { status: 401 });
  }
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Confirm your email address before voting." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const candidateId = typeof body?.candidateId === "string" ? body.candidateId : "";
  if (!/^[0-9a-f-]{36}$/i.test(candidateId)) {
    return NextResponse.json({ error: "Choose a valid candidate." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("cast_j6_top25_vote", {
    p_candidate_id: candidateId,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Your vote could not be recorded." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, result: data });
}
