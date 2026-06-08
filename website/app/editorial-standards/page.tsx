import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Editorial Standards",
  description:
    "How RealRyanNichols.com sources, labels, redacts, and corrects what it publishes — the line between testimony, opinion, allegation, and documented evidence, plus right-of-response, takedown, and prohibited-content rules.",
  alternates: { canonical: "/editorial-standards" },
};

export default function EditorialStandardsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        How this site handles the truth
      </p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
        Editorial Standards
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-soft)]">
        This site mixes one man&apos;s personal testimony with documented,
        evidence-driven work. These standards exist so you always know which is
        which — and so the people named here are treated fairly.
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
        Draft — final wording subject to review.
      </p>

      <div className="prose-body mt-8 space-y-7">
        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Four labels: testimony, opinion, allegation, evidence
          </h2>
          <p>
            Not everything on this site carries the same weight, and it&apos;s
            never presented as if it does:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Documented evidence</strong> — court filings, public
              records, bodycam, video, or contemporaneous documents you can
              examine yourself.
            </li>
            <li>
              <strong>Testimony</strong> — a first-hand account from Ryan or a
              named/anonymous source. True to the person telling it; still an
              account, not a court finding.
            </li>
            <li>
              <strong>Allegation</strong> — a claim that something happened that
              has not (yet) been proven. Labeled as an allegation, not a fact.
            </li>
            <li>
              <strong>Opinion / commentary</strong> — Ryan&apos;s analysis,
              argument, or criticism. Protected opinion about public matters and
              public officials&apos; official conduct — clearly his view, not a
              statement of fact.
            </li>
          </ul>
          <p>
            Case and archive items carry a label so the category is visible at a
            glance.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Sourcing standards
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Factual claims are tied to a record, a document, a dated event, or a
              named source wherever possible.
            </li>
            <li>
              Where a claim rests on a single uncorroborated source, it is framed
              as that source&apos;s account, not as established fact.
            </li>
            <li>
              Public officials are written about in terms of their{" "}
              <em>official conduct</em> and the public record.
            </li>
            <li>
              The site does not knowingly publish claims it believes to be false,
              and corrects the record when it learns otherwise (below).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Screenshots, videos, and documents
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Screenshots and clips are presented with as much original context
              as available, and described as &quot;needs authentication&quot;
              when their origin hasn&apos;t been verified.
            </li>
            <li>
              Where it matters, the native source (full video, original filing,
              full thread) is sought before treating an excerpt as conclusive.
            </li>
            <li>
              Edited or excerpted media is identified as such; nothing is
              presented as a complete record when it isn&apos;t.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Redaction standards
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Home addresses, phone numbers, dates of birth, Social Security and
              bank numbers, medical details, and minors&apos; identifying
              information are redacted before publication.
            </li>
            <li>
              A source&apos;s identity is protected per the boundary they set on
              the{" "}
              <Link href="/tell-your-story" className="underline">
                Tell Your Story
              </Link>{" "}
              form.
            </li>
            <li>
              Private third-party data is removed unless it is already public
              record and relevant to a matter of legitimate public concern.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Right of response for named people
          </h2>
          <p>
            If you are a named person and believe something published here is
            inaccurate, you may submit a response or a specific correction
            request through the{" "}
            <Link href="/contact" className="underline">
              private contact
            </Link>{" "}
            page. Substantive, good-faith responses about disputed facts will be
            considered, and accurate corrections will be made promptly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Corrections policy
          </h2>
          <p>
            When a material error is identified, it is corrected and — where the
            correction is significant — noted rather than silently changed. The
            goal is an accurate public record, not a perfect-looking one.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Takedown &amp; removal requests
          </h2>
          <p>
            To request correction or removal of specific content, use the{" "}
            <Link href="/contact" className="underline">
              private contact
            </Link>{" "}
            page and identify the page and the specific material at issue.
            Requests involving private personal data, a genuine safety concern,
            or a factual inaccuracy are prioritized. Requests aimed only at
            suppressing accurate reporting on a matter of public concern may be
            declined, with reasons.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Prohibited submissions &amp; content
          </h2>
          <p>This site will not solicit, accept, or publish:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Sealed records or material obtained illegally.</li>
            <li>A minor&apos;s private identifying information.</li>
            <li>Medical records, SSNs, or financial-account numbers.</li>
            <li>Private third-party data submitted without the legal right to share it.</li>
            <li>
              Threats, doxxing, calls to violence, or harassment of private
              individuals.
            </li>
            <li>Knowingly false claims presented as fact.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Questions
          </h2>
          <p>
            For anything about these standards — a correction, a response, or a
            removal request — use the{" "}
            <Link href="/contact" className="underline">
              private contact
            </Link>{" "}
            page. {SITE.name} is a personal publication and is not a law firm;
            nothing here is legal advice.
          </p>
        </section>
      </div>
    </article>
  );
}
