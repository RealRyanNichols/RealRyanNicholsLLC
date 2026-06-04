// Shared helpers for the password-gated counsel view (/counsel).
// Credentials never live in the repo: the password is stored only as a bcrypt
// hash in Supabase (table counsel_access), and verification happens inside
// SECURITY DEFINER RPCs so the anon client never reads the hash or a service key.
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const COUNSEL_COOKIE = "counsel_session";

// Returns the opaque session token when the username + password match, else null.
export async function counselTokenForLogin(
  username: string,
  password: string,
): Promise<string | null> {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase.rpc("counsel_login", {
    p_username: username,
    p_password: password,
  });
  return !error && typeof data === "string" && data.length >= 16 ? data : null;
}

// True when the cookie token matches the active session secret.
export async function isCounselSessionValid(
  token: string | undefined,
): Promise<boolean> {
  if (!token || token.length < 16) return false;
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase.rpc("counsel_session_valid", {
    p_token: token,
  });
  return !error && data === true;
}
