import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for realryannichols.com.",
};

const EFFECTIVE_DATE = "May 19, 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Effective {EFFECTIVE_DATE}
      </p>

      <div className="prose-body mt-8 space-y-6">
        <p>
          This is a personal site run by {SITE.author}. The goal is to write to
          the people who choose to listen — not to harvest data, run ads, or
          sell anything to advertisers. This page tells you what is collected,
          why, and how to make it stop.
        </p>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            What gets collected
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Email signups.</strong> If you enter your email to
              subscribe, the address and timestamp are stored along with a
              random token used for unsubscribe. Email is used solely to send
              new posts and the occasional housekeeping note from this site.
            </li>
            <li>
              <strong>Sign-in accounts.</strong> If you sign in to comment, the
              auth provider (Supabase) stores your email, a display name, and an
              avatar URL. Your user ID is attached to anything you post.
            </li>
            <li>
              <strong>Comments and reactions.</strong> Whatever you post
              publicly is associated with your account and visible to other
              readers once approved.
            </li>
            <li>
              <strong>Server logs.</strong> The hosting provider (Vercel) keeps
              transient request logs that include URL, user agent, and IP
              address for operational and abuse-prevention purposes. These are
              not used for tracking and roll off automatically.
            </li>
            <li>
              <strong>No third-party tracking by default.</strong> No Google
              Analytics, no Facebook Pixel, no advertising scripts.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            How email works
          </h2>
          <p>
            Emails to subscribers are sent through Resend. Every email contains
            an unsubscribe link that takes one click to honor — no login, no
            email-reply required. You can also reply to any email and ask to be
            removed manually.
          </p>
          <p>
            New subscriptions are confirmed by email (double opt-in). You
            won&apos;t receive any post broadcasts until you click the
            confirmation link in the first email.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Sharing with third parties
          </h2>
          <p>
            Subscriber lists are never sold, traded, rented, or shared. The
            third parties involved in running the site are limited to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Vercel (hosting and request routing)</li>
            <li>Supabase (database, authentication)</li>
            <li>Resend (email delivery)</li>
          </ul>
          <p>
            Each of those processors only sees the data necessary for its job
            and is bound by its own privacy terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Your choices
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Unsubscribe.</strong> Click the unsubscribe link at the
              bottom of any email. It is one click and takes immediate effect.
            </li>
            <li>
              <strong>Delete your account or comments.</strong> Email the
              address on the <Link href="/support" className="underline">Support</Link>{" "}
              page asking for removal and it will be done.
            </li>
            <li>
              <strong>Right of access.</strong> If you want a copy of what is
              stored about you, ask and you will receive it.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Children
          </h2>
          <p>
            This site is not directed to children under 13 and does not
            knowingly collect their information. If you believe a minor has
            submitted personal data, email and it will be removed.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Changes to this policy
          </h2>
          <p>
            If this policy materially changes, the effective date above is
            updated and active subscribers are notified by email.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">
            Contact
          </h2>
          <p>
            For privacy questions or data requests, see the{" "}
            <Link href="/support" className="underline">Support</Link> page.
          </p>
          {SITE.mailingAddress ? (
            <p>
              <strong>Mailing address:</strong>{" "}
              {SITE.mailingAddress}
            </p>
          ) : null}
        </section>
      </div>
    </article>
  );
}
