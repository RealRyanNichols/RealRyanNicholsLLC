// Legal Spotlight: index page (article list)
// Final destination: /website/app/legal-spotlight/page.tsx
// Article list lives in this file. Add new articles to ARTICLES at the top.
// Voice rules in /06-CONTENT-ENGINE/Blogs/Legal-Spotlight/STANDING-RULES.md.
// Zero em dashes in any rendered string. Verified.

import Link from "next/link";

export const metadata = {
  title: "Legal Spotlight | Faretta.Legal",
  description:
    "Plain-English breakdowns of the cases, statutes, and rights that actually decide what happens to ordinary people. New article every day.",
};

type Article = {
  slug: string;
  title: string;
  date: string;
  dateLabel: string;
  excerpt: string;
  tags: string[];
};

const ARTICLES: Article[] = [
  {
    slug: "why-faretta",
    title: "Why This Company Is Named Faretta",
    date: "2026-04-25",
    dateLabel: "April 25, 2026",
    excerpt:
      "A 1975 Supreme Court decision said you have the right to stand up for yourself in your own criminal case. Most Americans have never heard of it. That decision is the entire reason this company is named what it is named.",
    tags: ["self-representation", "rights", "scotus"],
  },
];

export default function LegalSpotlightIndexPage() {
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 text-neutral-800 leading-relaxed">
      {/* Header */}
      <header className="mb-12">
        <p className="text-sm uppercase tracking-wider text-neutral-500">
          Faretta.Legal
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
          Legal Spotlight
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-700">
          Plain-English breakdowns of the cases, statutes, and rights that actually
          decide what happens to ordinary people. Supreme Court first. Texas next.
          International when it matters. New article every day.
        </p>
      </header>

      {/* Featured article */}
      {featured && (
        <section className="mb-12">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
            Latest
          </p>
          <Link
            href={`/legal-spotlight/${featured.slug}`}
            className="group block rounded-2xl border border-neutral-200 bg-neutral-50 p-6 md:p-8 hover:bg-white hover:border-neutral-300 transition"
          >
            <p className="text-sm text-neutral-500">{featured.dateLabel}</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 group-hover:underline underline-offset-4">
              {featured.title}
            </h2>
            <p className="mt-3 text-neutral-700">{featured.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {featured.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold text-neutral-900">
              Read the article →
            </p>
          </Link>
        </section>
      )}

      {/* Older articles */}
      {rest.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            More articles
          </h2>
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {rest.map((a) => (
              <li key={a.slug} className="py-5">
                <Link
                  href={`/legal-spotlight/${a.slug}`}
                  className="group block"
                >
                  <p className="text-sm text-neutral-500">{a.dateLabel}</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900 group-hover:underline underline-offset-4">
                    {a.title}
                  </p>
                  <p className="mt-2 text-neutral-700">{a.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tip CTA */}
      <section className="mt-16">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
          <h3 className="text-2xl font-bold text-neutral-900">
            Got a story we should cover?
          </h3>
          <p className="mt-3 text-neutral-700">
            Send a tip. We redact every name and identifying detail. We never publish
            open criminal case specifics. We turn patterns of corruption, fraud, and
            rights violations into public-interest articles.
          </p>
          <div className="mt-5">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-neutral-900 px-5 py-3 text-white font-semibold hover:bg-neutral-800 transition"
            >
              Submit a Tip
            </Link>
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <footer className="mt-12 text-sm text-neutral-500">
        <p>
          Ryan Nichols and Faretta.Legal are not attorneys and do not provide legal
          advice. We provide investigative work, document review, evidence organization,
          plan of action, and strategy. Names and identifying details in case-based
          articles have been changed to protect the people involved.
        </p>
      </footer>
    </main>
  );
}
