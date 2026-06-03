import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupporterBadge } from "@/components/SupporterBadge";
import type { CaseCommentableType } from "@/lib/case";

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_supporter: boolean;
  verified_at: string | null;
  verified_linked_account: boolean;
};

export async function CaseCommentList({
  type,
  id,
}: {
  type: CaseCommentableType;
  id: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: rawComments, error } = await supabase
    .from("case_comments")
    .select("id, body, created_at, user_id")
    .eq("commentable_type", type)
    .eq("commentable_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Comments are temporarily unavailable.
      </p>
    );
  }

  const comments = (rawComments ?? []) as CommentRow[];
  if (comments.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No approved comments yet. Create an account and add the first case note.
      </p>
    );
  }

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: rawProfiles } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, avatar_url, is_supporter, verified_at, verified_linked_account",
    )
    .in("id", userIds);
  const profiles = new Map<string, ProfileRow>(
    (rawProfiles ?? []).map((p) => [p.id, p as ProfileRow]),
  );

  return (
    <ul className="space-y-5">
      {comments.map((c) => {
        const profile = profiles.get(c.user_id);
        const name = profile?.display_name ?? "Reader";
        const initial = name.charAt(0).toUpperCase();
        const verified = !!profile?.verified_at || !!profile?.verified_linked_account;
        return (
          <li key={c.id} className="flex gap-3">
            <div
              className="h-9 w-9 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold flex-shrink-0"
              aria-hidden
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap text-sm">
                {profile?.username ? (
                  <Link
                    href={`/u/${profile.username}`}
                    className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)] hover:underline"
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="font-semibold text-[var(--color-ink)]">{name}</span>
                )}
                {verified ? (
                  <span
                    title="Verified by admin"
                    className="rounded-full bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold"
                  >
                    ✓
                  </span>
                ) : null}
                {profile?.is_supporter ? <SupporterBadge size="xs" /> : null}
                <span className="text-[var(--color-muted)] text-xs">
                  {formatDistanceToNowStrict(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-[var(--color-ink-soft)] whitespace-pre-wrap">{c.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
