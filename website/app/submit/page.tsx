import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { TipForm } from "@/components/TipForm";

const TITLE = "Send a tip · The J6 Case";
const DESCRIPTION =
  "Share a January 6 defendant's name, story, or evidence. We review every tip and follow up if we need more.";

export const metadata: Metadata = {
  title: "Send a tip",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/submit` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/submit`,
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function SubmitPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        The J6 Case · Tip line
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight font-display">
        Send a tip
      </h1>
      <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed">
        Use this if you have a name to add, a story to share, or evidence to
        send — and you don't want to make an account. We read every tip. We
        follow up if we need more.
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Want your own profile and upload tools instead?{" "}
        <Link href="/j6" className="text-[var(--color-accent)] hover:underline">
          Read the mission
        </Link>{" "}
        or{" "}
        <Link
          href="/login?next=/account"
          className="text-[var(--color-accent)] hover:underline"
        >
          sign up free
        </Link>
        .
      </p>

      <div className="mt-8">
        <TipForm />
      </div>
    </article>
  );
}
