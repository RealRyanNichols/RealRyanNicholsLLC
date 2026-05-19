import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for realryannichols.com.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Privacy</h1>
      <div className="prose-body mt-6">
        <h2 className="font-display text-2xl text-[var(--color-ink)]">What this site collects</h2>
        <p>
          When you visit this site, the server records the minimum needed to deliver the
          page (request URL, user agent, IP address in transient logs). No third-party
          tracking scripts are loaded by default.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">Email signup</h2>
        <p>
          If you submit your email to subscribe, that address is stored so I can send you
          updates. You can ask me to remove it at any time and I will.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">Comments</h2>
        <p>
          Comments require signing in. The auth provider stores your email and display
          name. Your comments are visible to the public once approved.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">Contact</h2>
        <p>
          If you want anything about your data changed or removed, email me through the
          contact info that appears on the site footer or the Support page.
        </p>
      </div>
    </article>
  );
}
