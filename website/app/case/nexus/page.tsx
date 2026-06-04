import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { CaseNexus } from "@/components/CaseNexus";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";

// 5-minute ISR — the seed is the top co-defendant clusters, which only
// shift when new defendants get matched in. No need to hit Supabase on
// every request.
export const revalidate = 300;

const TITLE =
  "The Case Nexus — connect the J6 evidence map";
const DESCRIPTION =
  "A public evidence map for connecting J6 cases by case number, defendant, clue, witness statement, court document, video, picture, and archived record.";

const connectionTypes = [
  ["Court documents", "Dockets, filings, exhibits, orders, plea papers, sentencing records, and archived DOJ documents."],
  ["Witness statements", "People who saw the same event, heard the same instruction, received the same treatment, or can confirm a timeline."],
  ["Photos and videos", "Public clips, bodycam references, livestreams, still frames, metadata, timestamps, and location context."],
  ["Shared clues", "Names, agencies, prosecutors, officers, facilities, dates, charges, locations, aliases, URLs, and repeated fact patterns."],
];

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/case/nexus");
  const url = `${SITE.url}/case/nexus`;
  const ogUrl = override?.image_url ?? null;
  return {
    title: override?.title ?? "The Case Nexus",
    description: override?.description ?? DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      url,
      images: ogUrl
        ? [
            {
              url: ogUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: TITLE,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      images: ogUrl ? [ogUrl] : undefined,
    },
  };
}

type GraphPayload = {
  nodes: unknown[];
  edges: unknown[];
  seed?: { cases: number; defendants: number };
  error?: string | null;
};

export default async function CaseNexusPage() {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase.rpc("nexus_initial_seed", {
    seed_size: 40,
  });
  const initial: GraphPayload = error
    ? {
        nodes: [],
        edges: [],
        error:
          "The Case Nexus graph feed did not load. The case archive is still available.",
      }
    : ((data as GraphPayload | null) ?? {
        nodes: [],
        edges: [],
      });

  return (
    <article className="mx-auto max-w-[92rem] px-3 py-3 sm:px-4 sm:py-5">
      <header className="mb-3">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-normal text-[#7fe3a9]">
            The Case Nexus · connect every clue
          </p>
          <h1 className="mt-1 font-display text-3xl font-black leading-[1.02] tracking-normal sm:text-4xl">
            Every case. Every clue. One nexus.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
            Start with a case, name, document, witness, video, photo, date, or
            officer. The graph shows what it touches and where the missing clue
            belongs.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {["Case", "Person", "Document", "Witness", "Video", "Photo", "Clue"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-normal text-[var(--color-ink)]"
              >
                {label}
              </span>
            ))}
            <Link
              href="/submit"
              className="rounded-full border border-[#7fe3a9] bg-[#7fe3a9] px-3 py-1 text-center text-xs font-black uppercase tracking-normal text-[#071126] transition hover:bg-[#9df0c0]"
            >
              Add a clue
            </Link>
            <Link
              href="/tell-your-story"
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-center text-xs font-black uppercase tracking-normal text-[var(--color-ink)] transition hover:border-[#7fe3a9] hover:text-[var(--color-accent)]"
            >
              Tell story
            </Link>
          </div>
        </div>
      </header>

      {/* The graph */}
      <CaseNexus
        initial={initial as Parameters<typeof CaseNexus>[0]["initial"]}
        initialError={initial.error ?? null}
      />

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {connectionTypes.map(([title, body]) => (
          <div
            key={title}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <h2 className="font-display text-xl font-black tracking-normal">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {body}
            </p>
          </div>
        ))}
      </section>

      {/* Share rail */}
      <div className="mt-4">
        <ShareRail
          url={`${SITE.url}/case/nexus`}
          title="The Case Nexus — every J6 defendant, every case, every document, in one interactive graph: realryannichols.com/case/nexus"
        />
      </div>
      <div className="mt-3">
        <ReactionBar targetType="page" targetId="case-nexus" />
      </div>

      {/* Cross-links to the rest of the room */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CrossLink
          href="/the-map-room"
          title="The Map Room"
          sub="Live radar of every visitor reading the case right now."
        />
        <CrossLink
          href="/case/the-salvaged-doj-record"
          title="The salvaged DOJ record"
          sub="The original 1,092 defendants the DOJ scrubbed, preserved."
        />
        <CrossLink
          href="/case"
          title="The full case file"
          sub="Grievances, events, named officials, documents."
        />
      </section>

      {/* What it is */}
      <section className="mt-10 rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
          What this is becoming
        </p>
        <h2 className="mt-1 font-display text-3xl font-black tracking-normal">
          A public case web: facts, claims, documents, media, and witness
          statements connected by the thing they share.
        </h2>
        <div className="mt-3 prose-body text-sm sm:text-base">
          <p>
            The page starts with the largest <strong>co-defendant
            clusters</strong>. Each big navy circle is a case number. Each
            small dot is a defendant. Lines currently show two hard public
            links: people named on the same docket and archived documents tied
            to a person.
          </p>
          <p>
            The next layer is what people submit: witness statements, photos,
            videos, screenshots, court records, dispatch logs, bodycam
            references, officer names, prosecutor names, dates, facilities,
            charges, URLs, and repeated fact patterns. Those clues are how one
            story starts connecting to another.
          </p>
          <p>
            <strong>Click any node</strong> to open its details.
            <strong> Expand links</strong> to pull in its neighborhood.
            <strong> Search by name or case number</strong> to drop a new
            seed anywhere in the network. If you have a missing connector, send
            it in so it can be reviewed, protected where needed, and added to
            the record when safe.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Submit a missing connector →
          </Link>
          <Link
            href="/case/the-salvaged-doj-record"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            Browse the salvaged record →
          </Link>
        </div>
      </section>
    </article>
  );
}

function CrossLink({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-sm font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
        {sub}
      </p>
    </Link>
  );
}
