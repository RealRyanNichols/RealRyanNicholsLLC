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

const connectionTypes: { n: string; title: string; body: string; color: string }[] = [
  { n: "01", title: "Court documents", color: "#7fa9e3", body: "Dockets, filings, exhibits, orders, plea papers, sentencing records, and archived DOJ documents." },
  { n: "02", title: "Witness statements", color: "#e1bd5b", body: "People who saw the same event, heard the same instruction, received the same treatment, or can confirm a timeline." },
  { n: "03", title: "Photos and videos", color: "#ffd166", body: "Public clips, bodycam references, livestreams, still frames, metadata, timestamps, and location context." },
  { n: "04", title: "Shared clues", color: "#f08a8a", body: "Names, agencies, prosecutors, officers, facilities, dates, charges, locations, aliases, URLs, and repeated fact patterns." },
];

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/case/nexus");
  const url = `${SITE.url}/case/nexus`;
  const ogUrl = override?.image_url ?? `${SITE.url}/og/site`;
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
          <p className="text-xs font-black uppercase tracking-normal text-[#e1bd5b]">
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
            {([
              ["Case", "#1f2f55"],
              ["Person", "#e08658"],
              ["Document", "#7c8aa6"],
              ["Witness", "#7fa9e3"],
              ["Video", "#ffd166"],
              ["Photo", "#f08a8a"],
              ["Clue", "#e1bd5b"],
            ] as const).map(([label, color]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-1 pl-2 pr-2.5 text-[11px] font-bold uppercase tracking-normal text-[var(--color-ink)]"
              >
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
            <Link
              href="/submit"
              className="rounded-full bg-[#e1bd5b] px-3.5 py-1.5 text-center text-xs font-black uppercase tracking-normal text-[#071126] shadow-sm transition hover:brightness-105"
            >
              + Add a clue
            </Link>
            <Link
              href="/tell-your-story"
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-center text-xs font-black uppercase tracking-normal text-[var(--color-ink)] transition hover:border-[#e1bd5b] hover:text-[var(--color-accent)]"
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

      {/* Read the map — the key to every color, dot, and line on the board.
          Dark investigation-board panel so the graph stops being a mystery. */}
      <section className="mt-4 overflow-hidden rounded-xl border border-[#1f2f55] bg-[#0a1429] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e1bd5b]">
            Read the map
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7c8aa6]">
            Every dot and line, decoded
          </p>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {/* The dots */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#cfd9ea]">
              The dots — who and what
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#dbe4f4]">
              {[
                ["#1f2f55", "Case", "A case number. Bigger = more defendants on it.", "ring"],
                ["#e08658", "Defendant — unclaimed", "A person on the record; profile free to claim.", "dot"],
                ["#e1bd5b", "Defendant — verified", "A profile claimed and confirmed.", "dot"],
                ["#ffd166", "Defendant — pending", "A claim in review.", "dot"],
                ["#7c8aa6", "Document", "A filing, order, exhibit, or scan.", "dot"],
              ].map(([color, label, sub, shape]) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className={shape === "ring" ? "mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2" : "mt-1 h-3 w-3 flex-shrink-0 rounded-full"}
                    style={shape === "ring" ? { borderColor: "#3a557c", background: color } : { background: color }}
                  />
                  <span>
                    <span className="font-bold text-white">{label}</span>
                    <span className="block text-xs leading-snug text-[#9fb0cc]">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* The connectors */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#cfd9ea]">
              The hubs — what they share
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#dbe4f4]">
              {[
                ["#e1bd5b", "Source", "The DOJ / salvaged record a case came from."],
                ["#7fa9e3", "Court", "The court a case was filed in."],
                ["#ffd166", "Facility", "A jail or prison in the record."],
                ["#f08a8a", "Charge", "A charge shared across defendants."],
                ["#d8c89e", "Agency · year · pattern", "Other shared threads that tie cases together."],
              ].map(([color, label, sub]) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1 h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
                  <span>
                    <span className="font-bold text-white">{label}</span>
                    <span className="block text-xs leading-snug text-[#9fb0cc]">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* How to work it */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#cfd9ea]">
              How to work the board
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#dbe4f4]">
              {[
                ["Click", "any dot to open who it is and what it touches."],
                ["Expand", "a node to pull its whole neighborhood onto the board."],
                ["Search", "a name or case number to drop a new starting point."],
                ["Focus / Fit", "to isolate one thread or frame the whole web."],
              ].map(([verb, sub]) => (
                <li key={verb} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1.5 h-2 w-6 flex-shrink-0 rounded-full bg-[#e1bd5b]" />
                  <span>
                    <span className="font-bold text-white">{verb}</span>{" "}
                    <span className="text-xs leading-snug text-[#9fb0cc]">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-snug text-[#7c8aa6]">
              Thicker, brighter lines are the strongest links — a shared source,
              the same court, the same charge. Faint lines are looser threads.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
          The four ways one case connects to another
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {connectionTypes.map((c) => (
            <div
              key={c.title}
              className="group relative overflow-hidden rounded-xl border border-[#1f2f55] bg-[#0a1429] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#3a557c]"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
              <div className="flex items-center justify-between">
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-[#071126]"
                  style={{ background: c.color }}
                >
                  {c.n}
                </span>
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              </div>
              <h2 className="mt-3 font-display text-lg font-black tracking-normal text-white">
                {c.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#a9b7d0]">
                {c.body}
              </p>
            </div>
          ))}
        </div>
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
