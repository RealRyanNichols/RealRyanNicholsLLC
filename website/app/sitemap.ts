import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const staticPaths = [
    "",
    "/about",
    "/jan-6",
    "/support",
    "/community-rules",
    "/privacy",
  ];
  const now = new Date().toISOString();
  return [
    ...staticPaths.map((p) => ({
      url: `${SITE.url}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1.0 : 0.7,
    })),
    ...posts.map((p) => ({
      url: `${SITE.url}/posts/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
