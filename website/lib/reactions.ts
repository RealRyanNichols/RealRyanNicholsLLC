import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ReactionKind =
  | "amen"
  | "pray"
  | "support"
  | "fire"
  | "flag"
  | "salute"
  | "laugh"
  | "sad"
  | "mad";

export const REACTION_KINDS: ReactionKind[] = [
  "amen",
  "pray",
  "support",
  "fire",
  "flag",
  "salute",
  "laugh",
  "sad",
  "mad",
];

export type ReactionCounts = Record<ReactionKind, number>;

export const EMPTY_COUNTS: ReactionCounts = {
  amen: 0,
  pray: 0,
  support: 0,
  fire: 0,
  flag: 0,
  salute: 0,
  laugh: 0,
  sad: 0,
  mad: 0,
};

export async function getReactionsForPost(
  postId: string
): Promise<{ counts: ReactionCounts; mine: ReactionKind[] }> {
  const supabase = await getSupabaseServerClient();
  const [{ data: rows }, { data: auth }] = await Promise.all([
    supabase
      .from("reactions")
      .select("kind, user_id")
      .eq("post_id", postId),
    supabase.auth.getUser(),
  ]);
  const counts: ReactionCounts = { ...EMPTY_COUNTS };
  const mine = new Set<ReactionKind>();
  for (const r of rows ?? []) {
    const k = r.kind as ReactionKind;
    if (k in counts) counts[k] += 1;
    if (auth?.user && r.user_id === auth.user.id) mine.add(k);
  }
  return { counts, mine: Array.from(mine) };
}

export async function getReactionCountsBulk(
  postIds: string[]
): Promise<Map<string, ReactionCounts>> {
  if (postIds.length === 0) return new Map();
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("reactions")
    .select("post_id, kind")
    .in("post_id", postIds);
  const out = new Map<string, ReactionCounts>();
  for (const id of postIds) out.set(id, { ...EMPTY_COUNTS });
  for (const r of data ?? []) {
    const counts = out.get(r.post_id);
    if (!counts) continue;
    const k = r.kind as ReactionKind;
    if (k in counts) counts[k] += 1;
  }
  return out;
}
