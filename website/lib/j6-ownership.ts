import { getSupabaseServerClient } from "@/lib/supabase/server";

// Confirms the signed-in user owns the case_people row referenced by
// person_id. Returns { ok: false, error } on failure or { ok: true, userId,
// supabase, person } on success.
export async function requireJ6Owner(person_id: unknown) {
  if (typeof person_id !== "string" || !/^[0-9a-f-]{36}$/i.test(person_id)) {
    return { ok: false as const, error: "Invalid person_id.", status: 400 };
  }
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false as const, error: "Sign in first.", status: 401 };
  }
  const { data: person } = await supabase
    .from("case_people")
    .select("id, slug, name, claimed_by_user_id, claim_status")
    .eq("id", person_id)
    .maybeSingle();
  if (!person) {
    return { ok: false as const, error: "Profile not found.", status: 404 };
  }
  if (
    person.claimed_by_user_id !== auth.user.id ||
    person.claim_status !== "verified"
  ) {
    return {
      ok: false as const,
      error: "You don't own this profile.",
      status: 403,
    };
  }
  return { ok: true as const, supabase, userId: auth.user.id, person };
}
