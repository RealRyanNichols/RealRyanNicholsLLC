import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community rules",
  description: "How comments work on Ryan Nichols' site.",
};

export default function CommunityRulesPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Community rules</h1>
      <div className="prose-body mt-6">
        <p>A few ground rules so this stays a place real people can actually talk:</p>
        <ol>
          <li>
            <strong>Sign in to comment.</strong> No anonymous accounts. If you want to be
            heard, put your name on it.
          </li>
          <li>
            <strong>Disagree without threats.</strong> Hard conversations are welcome.
            Threats, doxxing, slurs, and harassment are not.
          </li>
          <li>
            <strong>No legal advice fights.</strong> I&apos;m not a lawyer and this isn&apos;t a law
            forum. Keep that out of the comments.
          </li>
          <li>
            <strong>One topic at a time.</strong> Stay on the post. Off-topic threads get
            trimmed.
          </li>
          <li>
            <strong>Moderation is mine.</strong> I read every comment. I approve most. I
            remove the ones that break these rules.
          </li>
        </ol>
        <p>
          If you can write to a neighbor on your front porch, you can write here. Welcome.
        </p>
      </div>
    </article>
  );
}
