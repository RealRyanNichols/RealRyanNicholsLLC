import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { TipForm } from "@/components/TipForm";
import { getOgImage } from "@/lib/og-images";

const TITLE = "Send a Tip | Help Build the Record";
const DESCRIPTION =
  "Send records, links, names, dates, and evidence leads. Real Ryan Nichols LLC reviews tips by hand and turns useful information into clearer records.";

const tipUses = [
  {
    title: "Pattern review",
    text: "Similar tips can show whether one incident is isolated or part of a larger record.",
  },
  {
    title: "Records requests",
    text: "A solid lead can become a public-records request, FOIA-style draft, or document checklist.",
  },
  {
    title: "Case files",
    text: "Verified public information can support timelines, source lists, and public case documentation.",
  },
  {
    title: "Follow-up questions",
    text: "If you leave contact information, Ryan can ask for the missing piece before publishing or acting.",
  },
];

const wantedTips = [
  "Court filings, docket links, hearing dates, orders, motions, or cause numbers.",
  "Screenshots, videos, audio, messages, emails, photos, receipts, or public posts.",
  "Names of agencies, officials, companies, attorneys, witnesses, or people involved.",
  "Dates, locations, badge numbers, report numbers, records-request numbers, or case numbers.",
  "The missing record: bodycam, dispatch logs, transcripts, CPS records, jail logs, financial records, or meeting minutes.",
  "Local issues in Texas, East Texas, Longview, Gregg County, Harrison County, or any place where the facts need daylight.",
];

const qualityChecks = [
  "What happened?",
  "Who was involved?",
  "Where did it happen?",
  "When did it happen?",
  "What proves it?",
  "What is still missing?",
];

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/submit");
  const title = override?.title ?? "Send a Tip";
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

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; about?: string }>;
}) {
  const sp = await searchParams;
  // Entry point sets the default category: J6-area links pass ?type=j6,
  // everything else (Feed, fights, direct) defaults to general news.
  const defaultCategory = sp.type === "j6" ? "j6" : "national";
  const subjectDefault = sp.about?.slice(0, 180);

  return (
    <article className="bg-[var(--color-paper)]">
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <Image
          src="/uploads/record-they-cant-bury-og-thumbnail.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-paper)_0%,rgba(247,243,235,0.94)_42%,rgba(247,243,235,0.78)_100%)]" />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              Real Ryan Nichols LLC · Tip line
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight tracking-normal text-[var(--color-ink)] sm:text-5xl">
              Send the record before it disappears.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
              If you have screenshots, court links, videos, filings, names,
              dates, or a story people keep burying, send it here. The goal is
              simple: organize the truth into a form people can follow.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {qualityChecks.slice(0, 3).map((item) => (
                <div
                  key={item}
                  className="border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-2 shadow-sm"
                >
                  <p className="text-sm font-bold text-[var(--color-ink)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              This is not emergency services, legal representation, or a
              guaranteed investigation. It is a structured way to get serious
              information into Ryan&apos;s review queue.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xl sm:p-5">
            <div className="mb-4 border-b border-[var(--color-line)] pb-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-muted)]">
                No account required
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-normal">
                What should Ryan look at?
              </h2>
            </div>
            <TipForm
              defaultCategory={defaultCategory}
              subjectDefault={subjectDefault}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              What we do with tips
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-normal text-[var(--color-ink)]">
              Tips become a cleaner record.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
              A tip is not just a message in an inbox. The useful ones can help
              build timelines, identify missing records, connect similar
              complaints, support public case files, or create the next records
              request.
            </p>
            <Link
              href="/case-review"
              className="mt-5 inline-flex rounded-lg border-2 border-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Need a private case review?
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tipUses.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
              >
                <h3 className="font-display text-xl font-bold tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
              What to send
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-normal">
              The best tip answers six questions fast.
            </h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {qualityChecks.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span className="text-sm font-bold text-[var(--color-ink)]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
            <h3 className="font-display text-xl font-bold tracking-normal">
              Good leads include:
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {wantedTips.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] p-5 text-white sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-white/70">
              Ask for more
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-normal">
              Know someone sitting on receipts?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
              Send them this page. One useful date, docket link, video, report
              number, screenshot, or missing-record lead can change the whole
              timeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-paper)]"
            >
              Open tip line
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Contact Ryan
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
