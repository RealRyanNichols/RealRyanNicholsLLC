import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { J6Workspace } from "@/components/J6Workspace";

export const metadata: Metadata = {
  title: "Case Builder workspace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The J6 Case Builder workspace, on its own page. It used to sit at the top
// of /account, where it read like the place you post to the feed — now the
// dashboard shows a small card and the workspace lives here, one tap away.
export default async function CaseBuilderWorkspacePage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/account/case-builder");

  const [{ data: profile }, { data: myJ6Profile }, { data: mySubmissions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", data.user.id)
        .maybeSingle(),
      supabase
        .from("case_people")
        .select(
          `id, slug, name, role, description, photo_url, claim_status, views_count, shares_count,
           case_number, court, judge_name, prosecutor_name, defense_attorney,
           arrest_date, plea_date, sentence_date, sentence_summary, disposition,
           charges, news_links, support_url`,
        )
        .eq("claimed_by_user_id", data.user.id)
        .eq("claim_status", "verified")
        .maybeSingle(),
      supabase
        .from("case_documents")
        .select(
          "id, title, doc_type, media_kind, file_url, embed_url, submission_status, created_at",
        )
        .eq("submitted_by_user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!myJ6Profile) {
    return (
      <article className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">No case workspace yet</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          The Case Builder workspace unlocks when a J6 defendant profile is
          claimed and verified under your account.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
          <Link href="/j6" className="text-[var(--color-navy)] hover:underline">
            Claim your free J6 profile →
          </Link>
          <Link href="/account" className="text-[var(--color-muted)] hover:underline">
            ← Back to your account
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href="/account" className="hover:underline">
          ← Your account
        </Link>
      </nav>
      <J6Workspace
        j6Profile={myJ6Profile}
        submissions={mySubmissions ?? []}
        firstName={
          profile?.full_name?.split(/\s+/)[0] ||
          profile?.display_name?.split(/\s+/)[0] ||
          myJ6Profile.name.split(/\s+/)[0]
        }
      />
    </div>
  );
}
