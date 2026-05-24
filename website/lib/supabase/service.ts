import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Use ONLY in trusted server paths (the
// Stripe webhook and admin write routes). NEVER import from a client component
// or expose the key to the browser.
export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
