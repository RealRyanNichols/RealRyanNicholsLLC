import { getSupabaseStaticClient } from "@/lib/supabase/static";

export type PublicSupporter = {
  id: string;
  created_at: string;
  purpose: string;
  display_name: string | null;
  message: string | null;
  amount: string | null;
};

// Human labels for the support "purpose" tags. Historical — the intent form
// is retired with donations; these keep old admin ledger rows readable.
export const PURPOSE_LABELS: Record<string, string> = {
  site: "Keep the site alive",
  video: "Own the video archive",
  children: "Crimes against children",
  officials: "Corrupt officials",
  community: "Help the community",
  needed: "Where needed most",
};

export function purposeLabel(purpose: string): string {
  return PURPOSE_LABELS[purpose] ?? "Support";
}

// Reads the curated, consent-respecting get_public_supporters() RPC (anon-safe:
// no email, no ip_hash; name/message/amount already gated by each supporter's
// own visibility choices). Only notes Ryan has published appear here.
export async function getPublishedSupporters(limit = 100): Promise<PublicSupporter[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase.rpc("get_public_supporters", { p_limit: limit });
  return (data ?? []) as PublicSupporter[];
}
