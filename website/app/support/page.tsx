import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Ways to support Ryan Nichols' writing and rebuild.",
};

export default function SupportPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Support the rebuild</h1>
      <div className="prose-body mt-6">
        <p>
          If something I&apos;ve written has been useful to you and you want to back the work,
          here are the honest ways to do that. None of them are required to read the site.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">Share a post</h2>
        <p>
          The single most useful thing you can do, at zero cost, is send a post to one
          person who would benefit from it. Algorithms don&apos;t move this place. People do.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">Subscribe by email</h2>
        <p>
          The signup in the sidebar puts new posts straight in your inbox. No platform in
          the middle.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">Send a tip</h2>
        <p>
          A donation link will be posted here shortly. For now, the best way to send
          something my way is to subscribe and forward a post. When the giving page is
          live, it&apos;ll be on this URL.
        </p>
        <p className="text-[var(--color-muted)] italic">
          Thank you for showing up.
        </p>
      </div>
    </article>
  );
}
