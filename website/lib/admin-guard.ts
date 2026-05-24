import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminOk = { ok: true; supabase: SupabaseClient; userId: string };
type AdminErr = { ok: false; status: number; error: string };

// Guard for admin-only API routes. Returns the authed supabase client + user id
// when the caller is an admin, or a status/error to return otherwise.
export async function requireAdminApi(): Promise<AdminOk | AdminErr> {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false, status: 401, error: "Sign in required." };
  }
  const { data: isAdmin } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (isAdmin !== true) {
    return { ok: false, status: 403, error: "Not authorized." };
  }
  return { ok: true, supabase, userId: auth.user.id };
}
