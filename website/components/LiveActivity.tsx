import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { LiveActivityRotator, type LiveActivityItem } from "./LiveActivityRotator";

// Pulls the freshest claims, submissions, and verifications, then hands
// the merged list to the client rotator so each item gets its own time
// in the strip. Server-side ISR (60s) refreshes the pool.
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
      .limit(20),
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
      .limit(20),
    supabase
      .from("case_people")
      .select("slug, name, claim_verified_at")
      .eq("is_j6_defendant", true)
      .eq("claim_status", "verified")
      .gte("claim_verified_at", since)
      .order("claim_verified_at", { ascending: false })
      .limit(20),
  ]);

  const items: LiveActivityItem[] = [];

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
      text: `${p.name} just joined`,
      href: `/case/people/${p.slug}`,
    });
  }

  items.sort(
    (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
  );
  // Cap the rotator pool. At 3.5s per item, 20 items cycle in ~70s
  // before looping. Plenty of variety without burning through ancient
  // activity from the tail of the 48-hour window.
  const top = items.slice(0, 20);

  if (top.length === 0) {
    return null;
  }

  return <LiveActivityRotator items={top} />;
}
