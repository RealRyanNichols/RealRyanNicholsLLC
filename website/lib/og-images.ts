import { cache } from "react";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getMainPageOgImage } from "@/lib/page-og-catalog";

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

// Share metadata and article structured data use the same request-local read.
export const getOgImage = cache(async (path: string): Promise<PageOgImage | null> => {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("page_og_images")
    .select("path, image_url, title, description, width, height")
    .eq("path", path)
    .maybeSingle();
  if (data) return data as PageOgImage;
  // Admin-pinned cards (including archive view/filter variants) win. Main
  // pages use the finished artwork when there is no matching override.
  const image = getMainPageOgImage(path);
  if (!image) return null;
  return {
    path,
    image_url: image.url,
    title: null,
    description: null,
    width: image.width,
    height: image.height,
  };
});

export async function getOgImages(paths?: string[]): Promise<PageOgImage[]> {
  if (paths?.length === 0) return [];
  const requestedPaths = paths ? new Set(paths) : null;
  const supabase = getSupabaseStaticClient();
  let query = supabase
    .from("page_og_images")
    .select("path, image_url, title, description, width, height")
    .order("path", { ascending: true });
  // The normal feed needs only a few cards. Deep "Load more" pages can have
  // hundreds of long slugs; keep their existing full lookup instead of
  // constructing a filter larger than the upstream request URL limit.
  if (paths && encodeURIComponent(paths.join(",")).length < 6000) {
    query = query.in("path", paths);
  }
  const { data } = await query;
  const images = (data ?? []) as PageOgImage[];
  return requestedPaths
    ? images.filter((image) => requestedPaths.has(image.path))
    : images;
}
