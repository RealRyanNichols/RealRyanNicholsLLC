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
  "The Case Nexus — the J6 knowledge graph";
const DESCRIPTION =
  "Every January 6 defendant, every case number, every linked document — laid out as a live force-directed graph. Click any node to see its details, expand its connections, and walk the network.";

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
    seed_size: 25,
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
    <article className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Hero — short, no preamble. The graph itself is the headline. */}
      <header className="max-w-3xl mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#7fe3a9] font-bold">
          The Case Nexus · realryannichols.com
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
          The whole J6 case, on one map.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          Every co-defendant cluster the DOJ ever filed, every defendant
          named on the salvaged Capitol Breach Cases listing, every
          document we&apos;ve archived — laid out as a live force-directed
          graph. Drag the canvas. Scroll to zoom. Click any node to open
          its details and pull its 1-hop neighborhood into view.
        </p>
      </header>

      {/* The graph */}
      <CaseNexus
        initial={initial as Parameters<typeof CaseNexus>[0]["initial"]}
        initialError={initial.error ?? null}
      />

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
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          What you&apos;re looking at
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          A knowledge graph for a case the previous DOJ tried to hide.
        </h2>
        <div className="mt-3 prose-body text-sm sm:text-base">
          <p>
            The page starts seeded with the 25 largest <strong>co-defendant
            clusters</strong> — the cases where the DOJ tried multiple
            people together (the Oath Keepers, the Proud Boys, the
            tunnel-mob cases). Each big navy circle is a case number; each
            small dot around it is a defendant on that case. Lines mean
            &ldquo;named on the same docket.&rdquo;
          </p>
          <p>
            <strong>Click any node</strong> to open the side drawer with
            its details. <strong>Hit &ldquo;Expand connections&rdquo;</strong>
            to pull in that node&apos;s 1-hop neighborhood — every defendant
            on the case, every document we&apos;ve archived for them.
            <strong> Search by name or case number</strong> in the box up
            top to drop a new seed anywhere in the network.
          </p>
          <p>
            Documents jump straight to the original PDF on the Wayback
            Machine, so even when the DOJ takes it down again, the link
            still works.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/case/the-salvaged-doj-record"
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Browse the salvaged record →
          </Link>
          <Link
            href="/the-map-room"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            Map Room →
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
