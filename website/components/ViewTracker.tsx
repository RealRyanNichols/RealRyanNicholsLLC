// View counting now happens once, server-side, in the edge middleware
// (records into page_arrivals → single-source trigger bumps posts.views_count).
// This component used to fire increment_post_views from the browser, which
// double-counted alongside the server. It's intentionally a no-op now; kept as
// a stable mount point so existing imports don't break.
export function ViewTracker(_props: { slug: string }) {
  return null;
}
