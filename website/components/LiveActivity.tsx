import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

type Activity = {
  when: string;
  icon: string;
  text: string;
  href?: string;
};

// Compact ticker above the feed — shows the freshest things happening
// on the site. Re-renders with the homepage's 60s ISR cycle so visitors
// who reload see live momentum.
export async function LiveActivity() {
  const supabase = getSupabaseStaticClient();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(); // 48 hrs

  const [
    { data: recentClaims },
    { data: recentSubmissions },
    { data: recentVerifiedProfiles },
  ] = await Promise.all([
    supabase
      .from("case_person_claims")
      .select(
        `created_at, status,
         person:case_people!person_id ( slug, name )`,
      )
      .eq("status", "approved")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("case_documents")
      .select(
        `created_at, title, media_kind,
         case_doc_person ( case_people:case_people!person_id ( slug, name ) )`,
      )
      .eq("submission_status", "approved")
      .not("submitted_by_user_id", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("case_people")
      .select("slug, name, claim_verified_at")
      .eq("is_j6_defendant", true)
      .eq("claim_status", "verified")
      .gte("claim_verified_at", since)
      .order("claim_verified_at", { ascending: false })
      .limit(4),
  ]);

  const items: Activity[] = [];

  for (const c of recentClaims ?? []) {
    const p = Array.isArray(c.person) ? c.person[0] : c.person;
    if (!p) continue;
    items.push({
      when: c.created_at,
      icon: "✓",
      text: `${p.name} claim approved`,
      href: `/case/people/${p.slug}`,
    });
  }

  for (const s of recentSubmissions ?? []) {
    const linked = Array.isArray(s.case_doc_person)
      ? s.case_doc_person[0]
      : null;
    const person = linked
      ? Array.isArray(linked.case_people)
        ? linked.case_people[0]
        : linked.case_people
      : null;
    if (!person) continue;
    items.push({
      when: s.created_at,
      icon: s.media_kind === "image" ? "📸" : s.media_kind === "video_embed" ? "🎬" : "📄",
      text: `${person.name} posted: ${s.title}`,
      href: `/case/people/${person.slug}`,
    });
  }

  for (const p of recentVerifiedProfiles ?? []) {
    if (!p.claim_verified_at) continue;
    items.push({
      when: p.claim_verified_at,
      icon: "🟢",
      text: `${p.name} joined`,
      href: `/case/people/${p.slug}`,
    });
  }

  items.sort(
    (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
  );
  const top = items.slice(0, 5);

  if (top.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--color-success)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          LIVE
        </span>
        <ul className="flex-1 flex flex-wrap gap-x-4 gap-y-1 min-w-0 text-xs">
          {top.map((a, i) => (
            <li key={i} className="flex items-center gap-1.5 min-w-0">
              <span className="flex-shrink-0">{a.icon}</span>
              {a.href ? (
                <a
                  href={a.href}
                  className="font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)] truncate"
                >
                  {a.text}
                </a>
              ) : (
                <span className="font-bold text-[var(--color-ink)] truncate">
                  {a.text}
                </span>
              )}
              <span className="text-[var(--color-muted)] whitespace-nowrap">
                · {formatDistanceToNowStrict(new Date(a.when), { addSuffix: false })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
