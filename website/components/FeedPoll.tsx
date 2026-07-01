import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { PollCard } from "@/components/PollCard";

// The homepage feed poll. Renders the active feed-placement poll from
// /admin/polls (if one exists) via the public feed_poll_active() RPC —
// anon-safe, no service key needed. Returns null when no poll is live,
// so the feed simply tightens up with zero layout cost.

type FeedPollRow = {
  poll_key: string;
  question: string;
  options: string[];
  status: string;
};

export async function FeedPoll({ className }: { className?: string }) {
  let row: FeedPollRow | null = null;
  try {
    const supabase = getSupabaseStaticClient();
    const { data } = await supabase.rpc("feed_poll_active");
    if (
      data &&
      typeof data === "object" &&
      typeof (data as FeedPollRow).poll_key === "string" &&
      Array.isArray((data as FeedPollRow).options)
    ) {
      row = data as FeedPollRow;
    }
  } catch {
    row = null;
  }
  if (!row) return null;

  return (
    <div className={className}>
      <PollCard
        pollKey={row.poll_key}
        question={row.question}
        options={row.options}
        kicker="The floor is yours"
      />
    </div>
  );
}
