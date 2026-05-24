import type { Metadata } from "next";
import Link from "next/link";
import { getCaseTotals } from "@/lib/case";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SiteMomentum } from "@/components/SiteMomentum";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const TITLE = "The J6 Case · Free, for every January 6 defendant";
const DESCRIPTION =
  "Free profiles, free upload tools, free login — for every January 6 defendant. Your case stacks into the master J6 case. The full record, in public, with no gatekeeping.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/j6");
  const title = override?.title ?? "The J6 Case";
  const fullTitle = override?.title ?? TITLE;
  const description = override?.description ?? DESCRIPTION;
  const url = `${SITE.url}/j6`;
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
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function J6MissionPage() {
  const totals = await getCaseTotals();

  const supabase = getSupabaseStaticClient();
  const [{ count: profilesReady }, { count: profilesClaimed }] = await Promise.all([
    supabase
      .from("case_people")
      .select("id", { count: "exact", head: true })
      .eq("is_j6_defendant", true)
      .eq("claim_status", "unclaimed"),
    supabase
      .from("case_people")
      .select("id", { count: "exact", head: true })
      .eq("is_j6_defendant", true)
      .eq("claim_status", "verified"),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: `${SITE.url}/j6`,
    description: DESCRIPTION,
    isPartOf: { "@type": "WebSite", url: SITE.url, name: SITE.name },
    about: {
      "@type": "Thing",
      name: "January 6 defendants legal record",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Ryan Nichols · A Promise
        </p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-bold tracking-tight font-display leading-[1.05]">
          The J6 Case.
        </h1>
        <p className="mt-5 text-xl sm:text-2xl text-[var(--color-ink-soft)] leading-snug">
          Free. For every January 6 defendant. Forever.
        </p>

        {(profilesReady ?? 0) > 0 ? (
          <p className="mt-4 inline-block rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] px-4 py-1.5 text-sm font-bold text-[var(--color-blue)]">
            {(profilesReady ?? 0).toLocaleString()} profiles ready to be claimed
            {(profilesClaimed ?? 0) > 0
              ? ` · ${profilesClaimed} already verified`
              : ""}
          </p>
        ) : null}

        {/* Live momentum panel — moved off the homepage feed so it lives where
            it makes thematic sense. Every tile clicks into the underlying list. */}
        <section className="mt-8">
          <SiteMomentum />
        </section>

        {/* The promise */}
        <section className="mt-10 space-y-5 text-base sm:text-lg leading-relaxed text-[var(--color-ink)]">
          <p>
            If you are a January 6 defendant — pardoned or still fighting — and
            you want your case told, I will build you a profile. You will get
            the login. You will upload your evidence. Your case will stack into
            the master J6 case.
          </p>
          <p>
            No fee. No retainer. No percentage. No gatekeeping.
          </p>
          <p>
            The $1.7 billion the courts have been talking about is not enough.
            Congress will not increase it until they see what really happened
            to us. They will not see it as long as case files sit locked inside
            law firms. So we put it in public. All of it. Yours next to mine.
          </p>
          <p>
            The goal is one airtight record the government cannot refute.
            That is how this case is won.
          </p>
        </section>

        {/* Two CTAs */}
        <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/login?next=/account"
            className="block rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-4 text-center font-bold text-lg hover:bg-[var(--color-accent-strong)] transition"
          >
            Get a profile →
          </Link>
          <Link
            href="/submit"
            className="block rounded-xl border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-4 text-center font-bold text-lg hover:bg-[var(--color-blue-strong)] transition"
          >
            Send a tip / share a name →
          </Link>
        </section>

        {/* How it works */}
        <section className="mt-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
            How it works
          </h2>
          <ol className="mt-5 space-y-5">
            <Step
              n={1}
              title="Sign up"
              body="Free account, takes a minute. Real name, real email. You can do this on a phone."
            />
            <Step
              n={2}
              title="I verify it is actually you"
              body="DOJ docket match, mugshot or pardon match, and if needed a quick video call. Nobody else gets a profile in your name."
            />
            <Step
              n={3}
              title="Your profile goes live"
              body="You get your own page, your own upload tools, your own login. Photos, scanned documents, video embeds (TikTok / YouTube / X), and your testimony in your words. Direct video uploads coming soon. Everything you upload waits for review before it goes public — so nothing wrong gets posted by accident."
            />
          </ol>
        </section>

        {/* Why this matters */}
        <section className="mt-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
            Why we are doing this in public
          </h2>
          <div className="mt-5 space-y-4 text-base sm:text-lg leading-relaxed">
            <p>
              When a case file sits inside a law firm, only the lawyers and
              the court see it. The public hears soundbites. They do not see
              the grievance forms denied without a hearing. They do not see
              the water shut off. They do not see the denial of access to
              counsel. They do not see four years of constitutional rights
              violated, one piece of paper at a time.
            </p>
            <p>
              We put the paper in public. Every grievance. Every event.
              Every named official. Every document. Every defendant who
              joins.
            </p>
            <p>
              That is the record Congress needs to act. That is the record
              future cases will cite. That is the record they cannot bury.
            </p>
          </div>
        </section>

        {/* Live counter — what is already in the archive */}
        <section className="mt-14 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Already in the archive
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat n={totals.documents} label="Documents" />
            <Stat n={totals.grievances} label="Grievances" />
            <Stat n={totals.events} label="Timeline events" />
            <Stat n={totals.daysDetained} label="Days detained (Ryan)" />
          </div>
          <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
            See what a profile looks like:{" "}
            <Link
              href="/case/people/ryan-nichols"
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              Ryan Nichols
            </Link>
            {" · "}
            <Link
              href="/case"
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              The full case archive
            </Link>
          </p>
        </section>

        {/* Final CTAs */}
        <section className="mt-12 text-center">
          <p className="text-base sm:text-lg text-[var(--color-ink-soft)]">
            You ready?
          </p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <Link
              href="/login?next=/account"
              className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-6 py-3 font-bold hover:bg-[var(--color-accent-strong)] transition"
            >
              Get a profile
            </Link>
            <Link
              href="/submit"
              className="rounded-xl border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-6 py-3 font-bold hover:bg-[var(--color-blue-strong)] transition"
            >
              Send a tip
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] flex items-center justify-center font-bold text-lg">
        {n}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-[var(--color-ink-soft)] leading-relaxed">
          {body}
        </p>
      </div>
    </li>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
        {n.toLocaleString()}
      </div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}
