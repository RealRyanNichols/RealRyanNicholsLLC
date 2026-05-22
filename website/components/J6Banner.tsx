import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Slim conversion banner on the homepage feed. Points readers to the
// full J6 hub (/j6) where the live SiteMomentum panel lives.
export async function J6Banner() {
  const supabase = getSupabaseStaticClient();
  const { count } = await supabase
    .from("case_people")
    .select("id", { count: "exact", head: true })
    .eq("is_j6_defendant", true)
    .eq("claim_status", "unclaimed");

  const profilesReady = count ?? 0;

  return (
    <Link
      href="/j6"
      className="block rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-4 sm:p-5 hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)] transition group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-[var(--color-blue)] group-hover:text-[var(--color-paper)]">
            {profilesReady.toLocaleString()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-accent)] group-hover:text-[var(--color-paper)]">
            J6 Anti-Weaponization Case Builder
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-paper)] leading-tight">
            January 6 defendant profiles waiting to be claimed.
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)] group-hover:text-[var(--color-paper)]">
            Find your name. Free. Forever. →
          </p>
        </div>
      </div>
    </Link>
  );
}
