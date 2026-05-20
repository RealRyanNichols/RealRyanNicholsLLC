import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export type SiteSettings = {
  avatar_url: string | null;
  cover_url: string | null;
  case_og_url: string | null;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("site_settings")
    .select("avatar_url, cover_url, case_og_url")
    .eq("id", "default")
    .maybeSingle();
  return {
    avatar_url: data?.avatar_url ?? (SITE.avatarPath || null),
    cover_url: data?.cover_url ?? (SITE.coverPath || null),
    case_og_url: data?.case_og_url ?? null,
  };
}
