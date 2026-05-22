import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { TipForm } from "@/components/TipForm";
import { getOgImage } from "@/lib/og-images";

const TITLE = "Send a tip · The J6 Case";
const DESCRIPTION =
  "Share a January 6 defendant's name, story, or evidence. We review every tip and follow up if we need more.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/submit");
  const title = override?.title ?? "Send a tip";
  const fullTitle = override?.title ?? TITLE;
  const description = override?.description ?? DESCRIPTION;
  const url = `${SITE.url}/submit`;
  const ogImageUrl = override?.image_url ?? null;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: fullTitle,
      description,
      url,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: fullTitle,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

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
