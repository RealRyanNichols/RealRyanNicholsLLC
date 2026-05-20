import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function CommentList({ postId }: { postId: string }) {
  const supabase = await getSupabaseServerClient();
  const { data: rawComments, error } = await supabase
    .from("comments")
    .select("id, body, created_at, user_id")
    .eq("post_id", postId)
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
        No approved comments yet. Be the first to sign in and add one.
      </p>
    );
  }

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: rawProfiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);
  const profiles = new Map<string, ProfileRow>(
    (rawProfiles ?? []).map((p) => [p.id, p as ProfileRow])
  );

  return (
    <ul className="space-y-5">
      {comments.map((c) => {
        const profile = profiles.get(c.user_id);
        const name = profile?.display_name ?? "Reader";
        const initial = name.charAt(0).toUpperCase();
        return (
          <li key={c.id} className="flex gap-3">
            <div
              className="h-9 w-9 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold flex-shrink-0"
              aria-hidden
            >
              {initial}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold text-[var(--color-ink)]">{name}</span>
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
