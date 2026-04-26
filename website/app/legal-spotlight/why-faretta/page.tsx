// Legal Spotlight: Article #1
// Final destination: /website/app/legal-spotlight/why-faretta/page.tsx
// Source of truth: /06-CONTENT-ENGINE/Blogs/Legal-Spotlight/Articles/2026-04-25-why-faretta.md
// Voice rules locked in /06-CONTENT-ENGINE/Blogs/Legal-Spotlight/STANDING-RULES.md.
// Zero em dashes in any rendered string. Verified.

import Link from "next/link";

export const metadata = {
  title: "Why This Company Is Named Faretta | Faretta.Legal",
  description:
    "A 1975 Supreme Court decision said you have the right to stand up for yourself in your own criminal case. Most Americans have never heard of it. That decision is the entire reason this company is named Faretta.",
  openGraph: {
    title: "Why This Company Is Named Faretta",
    description:
      "Faretta v. California, 422 U.S. 806 (1975). The Supreme Court case behind the name.",
    type: "article",
    publishedTime: "2026-04-25",
    authors: ["Ryan Nichols"],
  },
};

const PUBLISHED = "April 25, 2026";
const TAGS = ["self-representation", "rights", "brand", "scotus"];

export default function WhyFarettaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-neutral-800 leading-relaxed">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-500 mb-6">
        <Link href="/" className="underline-offset-2 hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/legal-spotlight" className="underline-offset-2 hover:underline">
          Legal Spotlight
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-700">Why This Company Is Named Faretta</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-neutral-900">
          Why This Company Is Named Faretta
        </h1>
        <p className="mt-3 text-base text-neutral-500">
          By Ryan Nichols
          <span className="mx-2">·</span>
          {PUBLISHED}
          <span className="mx-2">·</span>
          Legal Spotlight
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      {/* Hook */}
      <section className="mb-8">
        <p className="text-xl text-neutral-800 leading-relaxed">
          A 1975 Supreme Court decision said you have the right to stand up for yourself in
          your own criminal case. Most Americans have never heard of it. That decision is
          the entire reason this company is named what it is named.
        </p>
      </section>

      {/* What this is */}
      <section className="mb-8 space-y-4">
        <h2 className="text-2xl font-semibold mt-2 text-neutral-900">What this is</h2>
        <p>
          In 1975, the United States Supreme Court decided <em>Faretta v. California</em>.
          Anthony Faretta was charged with grand theft in California. He told the trial
          judge he wanted to represent himself. The judge agreed at first, then changed his
          mind and put a public defender on the case anyway. Faretta lost at trial. He
          appealed.
        </p>
        <p>
          The Supreme Court reversed. Six justices ruled that the Sixth Amendment gives
          every criminal defendant the right to defend himself in person, as long as he
          gives up the right to a lawyer knowingly and intelligently. The Court said the
          Constitution does not allow a state to force counsel on a defendant who does not
          want one.
        </p>
        <p>
          That right is called <em>pro se</em> representation. Two Latin words that mean
          "for himself."
        </p>
      </section>

      {/* Why it matters: pull quote treatment */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mt-2 text-neutral-900">Why it matters</h2>
        <p className="mt-4">
          When the system feels stacked against you, the deepest right you still have is
          the right to speak for yourself. Not to be spoken for. Not to be processed. To
          stand up, in your own voice, in your own case, and answer the charges.
        </p>
        <blockquote className="mt-6 border-l-4 border-neutral-900 pl-4 text-xl italic text-neutral-900">
          That is the floor. Below that floor is not a republic.
        </blockquote>
      </section>

      {/* What the law actually says */}
      <section className="mb-10 space-y-5">
        <h2 className="text-2xl font-semibold text-neutral-900">
          What the law actually says
        </h2>

        <div>
          <h3 className="font-semibold text-neutral-900">SCOTUS</h3>
          <p>
            <em>Faretta v. California</em>, 422 U.S. 806 (1975). The Sixth Amendment
            grants a criminal defendant the right to conduct his own defense, provided
            the waiver of counsel is knowing and intelligent. Forcing a lawyer on an
            unwilling defendant violates the Constitution.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-900">Texas</h3>
          <p>
            Article I, Section 10 of the Texas Constitution says every accused person has
            the right "of being heard by himself or counsel, or both." The Texas Code of
            Criminal Procedure, Article 1.051, codifies the same idea: a defendant may
            waive the right to counsel if the waiver is voluntary and intelligent. Texas
            trial courts apply the <em>Faretta</em> standard when a defendant decides to
            go it alone.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-900">International</h3>
          <p>
            The International Covenant on Civil and Political Rights, Article 14(3)(d),
            recognizes the right of every accused person "to defend himself in person or
            through legal assistance of his own choosing." The European Convention on
            Human Rights, Article 6(3)(c), says the same. The right to self-representation
            is not an American quirk. It is a baseline of any free legal system.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-900">Where it gets narrow</h3>
          <p>
            <em>Faretta</em> gives you the right to represent yourself. It does not give
            you the right to be good at it. A judge can warn you. A judge can appoint
            standby counsel. A judge can stop you if you become disruptive. Going pro se
            is a right, not a strategy. Most people who exercise it without a plan lose.
          </p>
        </div>
      </section>

      {/* Takeaway */}
      <section className="mb-10 space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-900">The takeaway</h2>
        <p>
          You have the right to stand up for yourself. You do not have the right to do it
          badly and expect a different outcome. If you are walking into a courtroom
          without a lawyer, the work is not optional. You need a chronology, a paper
          trail, the right motions, and a clean theory of your case. None of that
          requires a law license. All of it requires preparation.
        </p>
        <p>
          That is the entire reason this company exists. We are not here to replace a
          lawyer. We are here to make sure the people who have no lawyer, or no good
          lawyer, walk in with a plan.
        </p>
      </section>

      {/* CTA card */}
      <section className="mb-12">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
          <p className="text-sm uppercase tracking-wider text-neutral-500">
            Recommended next step
          </p>
          <h3 className="mt-2 text-2xl font-bold text-neutral-900">
            Quick Case Direction · $19
          </h3>
          <p className="mt-3 text-neutral-700">
            One written response. Plain English. Pointed at your next move. Built for the
            person who is about to stand up for themselves and does not know where to
            start.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/services/quick-case-direction"
              className="inline-flex items-center rounded-lg bg-neutral-900 px-5 py-3 text-white font-semibold hover:bg-neutral-800 transition"
            >
              See Quick Case Direction
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border border-neutral-300 px-5 py-3 text-neutral-900 font-semibold hover:bg-white transition"
            >
              Submit a Tip (free)
            </Link>
          </div>
        </div>
      </section>

      {/* Share row */}
      <section className="mb-10">
        <p className="text-sm text-neutral-500">Share this article</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
            href="https://twitter.com/intent/tweet?text=In%201975%2C%20the%20Supreme%20Court%20ruled%20you%20have%20the%20right%20to%20stand%20up%20for%20yourself%20in%20your%20own%20criminal%20case.%20Most%20people%20have%20never%20heard%20of%20it.&url=https%3A%2F%2Ffaretta.legal%2Flegal-spotlight%2Fwhy-faretta"
            target="_blank"
            rel="noopener"
          >
            Share on X
          </a>
          <a
            className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
            href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ffaretta.legal%2Flegal-spotlight%2Fwhy-faretta"
            target="_blank"
            rel="noopener"
          >
            Share on Facebook
          </a>
          <a
            className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
            href="https://truthsocial.com/share?url=https%3A%2F%2Ffaretta.legal%2Flegal-spotlight%2Fwhy-faretta"
            target="_blank"
            rel="noopener"
          >
            Share on Truth
          </a>
        </div>
      </section>

      {/* Disclosure footer */}
      <hr className="my-10 border-neutral-200" />
      <footer className="text-sm text-neutral-500">
        <p>
          Ryan Nichols and Faretta.Legal are not attorneys and do not provide legal
          advice. We provide investigative work, document review, evidence organization,
          plan of action, and strategy. If you have a legal emergency, contact a licensed
          attorney in your jurisdiction.
        </p>
      </footer>
    </main>
  );
}
