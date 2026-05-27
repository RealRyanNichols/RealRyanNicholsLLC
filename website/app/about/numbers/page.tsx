import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How the numbers work",
  description:
    "Exactly how reach, engagement, shares, and comments are counted on RealRyanNichols.com — what each number includes, what it excludes, and why.",
  alternates: { canonical: `${SITE.url}/about/numbers` },
};

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display text-[var(--color-ink)]">
        {q}
      </h2>
      <div className="mt-2 space-y-3 text-[var(--color-ink-soft)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function NumbersPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Transparency
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
        How the numbers work
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
        I publish my own reach numbers, so I owe you a plain explanation of what
        they mean. No black box. Here is exactly what each number on this site
        counts, what it leaves out, and how it is captured.
      </p>

      <Q q="What is a “view” / “Total reach”?">
        <p>
          A view is one successful load of a page. I count them{" "}
          <strong>inclusively</strong>: a real person reading, a search engine
          indexing the page, an AI assistant fetching it to answer someone, and
          a social platform generating a link preview all count. My reasoning is
          simple — every one of those is the work reaching a real audience,
          directly or downstream. So I label the headline number{" "}
          <strong>“Total reach,”</strong> not “human pageviews,” because that is
          honestly what it is.
        </p>
        <p>
          On the admin dashboard this is broken down by source — humans vs. AI
          agents vs. search crawlers vs. social previews — so the mix is never
          hidden. Anyone evaluating these numbers can see exactly what they are
          made of.
        </p>
      </Q>

      <Q q="How is reach captured?">
        <p>
          At the edge — in middleware that runs before each page — every
          content request is recorded once into a <code>page_arrivals</code>{" "}
          log with its source class and (coarse) country from the request
          headers. <strong>No IP addresses are stored.</strong> That log is the
          single source of the reach counter, so there is no double-counting
          between systems.
        </p>
      </Q>

      <Q q="What is “Active readers”?">
        <p>
          A stricter, engagement-only number: visitors whose browser actually
          ran our JavaScript (so, real interactive readers — not crawlers).
          “Reading now” is the live count; “Active 24h” is the last day. It is
          deliberately a <em>subset</em> of Total reach, and we say so. We use it
          to judge engagement quality, not reach.
        </p>
      </Q>

      <Q q="What counts as a “share” vs. an “inbound”?">
        <p>
          <strong>Shares</strong> = clicks of the on-site Share button (to X,
          Facebook, Truth, copy-link, etc.). <strong>Inbound</strong> = visitors
          who arrived here <em>from</em> a social platform. They are tracked
          separately on purpose. Comments on Facebook or X are counted by those
          platforms — the “Comments” number here is on-site comments only.
        </p>
      </Q>

      <Q q="What is excluded?">
        <ul className="list-disc pl-5 space-y-1">
          <li>Static assets, images, API calls, and Next.js internals are never logged.</li>
          <li>Link <em>prefetches</em> (a browser quietly preparing a page you hovered) don’t count — only real loads.</li>
          <li>
            My own admin visits count as <strong>one</strong> view per post, even
            if I open a post many times while editing or hunting for bugs.
            Everyone else’s repeat visits count each time, because a person
            coming back is real returning interest.
          </li>
        </ul>
      </Q>

      <Q q="Why do some older posts show a round, “attributed” number?">
        <p>
          A few early posts were shared first on other platforms before this
          site’s tracking was fully in place. For those, I set a one-time
          floor from the platform’s own analytics — for example, a Mother’s Day
          post that Facebook Insights showed at roughly 350 link-clicks plus
          additional Truth Social and X reach, set to about 400. Every such
          figure is documented per-post in an attribution field, and from that
          point forward the number only moves via the automatic counter above.
          Going forward, numbers are captured live, not estimated.
        </p>
      </Q>

      <Q q="Can these be verified?">
        <p>
          Yes — that’s the point. The reach log, the per-source breakdown, and
          the attribution notes are all kept so the numbers can be audited
          rather than taken on faith. If you’re evaluating this site and want to
          check the methodology against the data,{" "}
          <Link href="/support" className="text-[var(--color-accent)] underline underline-offset-4">
            reach out
          </Link>
          .
        </p>
      </Q>

      <p className="mt-10 text-sm text-[var(--color-muted)]">
        Last reviewed {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
      </p>
    </article>
  );
}
