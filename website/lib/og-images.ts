import { getSupabaseStaticClient } from "@/lib/supabase/static";

export type PageOgImage = {
  path: string;
  image_url: string;
  title: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
};

// Normalize a Next.js searchParams object into the canonical path string
// we store in page_og_images.path. Keys are sorted so '?a=1&b=2' and
// '?b=2&a=1' map to the same row.
export function canonicalPath(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
): string {
  if (!searchParams) return pathname;
  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) entries.push([k, item]);
    } else {
      entries.push([k, v]);
    }
  }
  if (entries.length === 0) return pathname;
  entries.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `${pathname}?${qs}`;
}

export async function getOgImage(path: string): Promise<PageOgImage | null> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("page_og_images")
    .select("path, image_url, title, description, width, height")
    .eq("path", path)
    .maybeSingle();
  return (data ?? null) as PageOgImage | null;
}

export async function getOgImages(): Promise<PageOgImage[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("page_og_images")
    .select("path, image_url, title, description, width, height")
    .order("path", { ascending: true });
  return (data ?? []) as PageOgImage[];
}
