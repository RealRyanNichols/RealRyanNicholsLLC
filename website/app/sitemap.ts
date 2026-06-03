import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";
import {
  getGrievances,
  getPeople,
  getDocuments,
  getEvents,
} from "@/lib/case";
import { getPublicLiveStreams } from "@/lib/live";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, grievances, people, documents, events, liveStreams] = await Promise.all([
    getPublishedPosts(),
    getGrievances(),
    getPeople(),
    getDocuments(),
    getEvents(),
    getPublicLiveStreams(),
  ]);

  // Public, non-banned, has-username profiles only
  const supabase = getSupabaseStaticClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .not("username", "is", null)
    .neq("status", "banned");

  const now = new Date().toISOString();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE.url}/case`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE.url}/case/brief`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE.url}/case/damages`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE.url}/case/witnesses`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/case?view=timeline`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/case?view=grievances`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/case?view=people`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/case?view=documents`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/videos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/live`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/fights`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/the-map-room`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/submit`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/case-review`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/store`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/jan-6`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/support`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/community-rules`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE.url}/posts/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: p.pinned ? 0.95 : 0.85,
  }));

  const liveEntries: MetadataRoute.Sitemap = liveStreams.map((stream) => ({
    url: `${SITE.url}/live/${stream.slug}`,
    lastModified: stream.updated_at,
    changeFrequency: stream.status === "live" ? "hourly" : "weekly",
    priority: stream.status === "live" ? 1.0 : 0.75,
  }));

  const grievanceEntries: MetadataRoute.Sitemap = grievances.map((g) => ({
    url: `${SITE.url}/case/grievances/${g.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const personEntries: MetadataRoute.Sitemap = people.map((p) => ({
    url: `${SITE.url}/case/people/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const documentEntries: MetadataRoute.Sitemap = documents.map((d) => ({
    url: `${SITE.url}/case/documents/${d.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE.url}/case/events/${e.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${SITE.url}/u/${p.username}`,
    lastModified: p.updated_at ?? now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...postEntries,
    ...liveEntries,
    ...grievanceEntries,
    ...personEntries,
    ...documentEntries,
    ...eventEntries,
    ...profileEntries,
  ];
}
