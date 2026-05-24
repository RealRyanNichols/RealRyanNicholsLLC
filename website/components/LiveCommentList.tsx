import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

type LiveCommentRow = {
  id: string;
  display_name: string | null;
  body: string;
  created_at: string;
};

export async function LiveCommentList({ liveStreamId }: { liveStreamId: string }) {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("live_comments")
    .select("id, display_name, body, created_at")
    .eq("live_stream_id", liveStreamId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
        Live comments are being connected.
      </p>
    );
  }

  const comments = (data ?? []) as LiveCommentRow[];
  if (comments.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
        No public comments yet. Start the room with a question people can answer.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[var(--color-ink)]">
              {comment.display_name || "Viewer"}
            </span>
            <span className="text-[var(--color-muted)]">
              {formatDistanceToNowStrict(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {comment.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
