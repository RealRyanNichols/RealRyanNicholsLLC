import { getPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const revalidate = 300;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getPublishedPosts();
  const items = posts
    .map((p) => {
      const link = `${SITE.url}/posts/${p.slug}`;
      const pubDate = p.published_at
        ? new Date(p.published_at).toUTCString()
        : new Date().toUTCString();
      const excerpt = p.body.slice(0, 400).replace(/\s+/g, " ").trim();
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(excerpt)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
