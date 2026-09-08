import type { Metadata } from "next";
import {
  getGrievances,
  getPeople,
  getPersonBySlug,
  getEvents,
  getDocuments,
  getDocumentsForPerson,
  getCaseTotals,
  getJ6ClaimCounts,
  getJ6DefendantCount,
  getJ6PeoplePage,
} from "@/lib/case";
import { getSiteSettings } from "@/lib/site-settings";
import { getOgImage, canonicalPath } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { RyanCaseProfile } from "@/components/RyanCaseProfile";
import { J6PathSplit } from "@/components/J6PathSplit";
import {
  GrievancesView,
  TimelineView,
  DocumentsView,
} from "@/components/case/ArchiveViews";
import { getPublishedPosts } from "@/lib/posts";
import { SUBJECT_SLUG } from "@/lib/bio";
import { ArchiveHeader } from "@/components/case/ArchiveHeader";
import { ArchivePager } from "@/components/case/ArchivePager";
import { ArchiveTabs, J6DirectoryTabs } from "@/components/case/CaseTabNav";
import { J6DefendantsView } from "@/components/case/J6DefendantsView";
import { J6DirectoryHeader } from "@/components/case/J6DirectoryHeader";
import {
  ARCHIVE_LIST_ID,
  filterArchive,
  pageArchive,
  pageDirectory,
  parseJ6Filter,
  parsePage,
  parseTab,
  shouldRenderJ6Directory,
} from "@/components/case/archive";

// The /case route: three doors, one file that only composes. The front door
// is Ryan's own case (components/RyanCaseProfile.tsx); ?view=people is the
// J6 people directory; every other ?view= is the archive. Each chapter of
// those pages is its own server component under components/case/, and the
// non-visual logic (tab and filter parsing, search, paging, which number a
// stat shows) is components/case/archive.ts. Data calls stay here.

export const revalidate = 300;

const CASE_TITLE = "The J6 Case · United States v. Nichols & every defendant who joins";
const CASE_DESCRIPTION =
  "The master January 6 case archive. Starts with United States v. Nichols — every filed grievance, every named official, every event, every document. Other J6 defendants are joining and stacking their cases in. The full record, in public, free.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; filter?: string; page?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  // Strip the search query from the canonical OG lookup — q is user input
  // and won't have a configured OG image. View/filter are part of the URL
  // shape that matters for share cards.
  const lookupParams: Record<string, string | undefined> = {};
  if (sp.view) lookupParams.view = sp.view;
  if (sp.filter) lookupParams.filter = sp.filter;
  const ogLookup = canonicalPath("/case", lookupParams);
  const override = await getOgImage(ogLookup);
  // The share card is the same on every slice of a paged view, so the
  // override lookup stays page-less. The canonical URL is not: a later page
  // of the timeline or documents view is its own address, or crawlers fold
  // every slice into page one.
  const page = parsePage(sp.page);
  const canonical =
    sp.view && page > 1
      ? canonicalPath("/case", { ...lookupParams, page: String(page) })
      : ogLookup;

  const settings = await getSiteSettings();
  // Self-created, self-hosted default card — /og/case renders a branded share
  // image from live stats for any view, so no case page ships without one.
  // Precedence: a pinned override wins, then the site setting, then the
  // auto-generated card.
  const autoOg = `${SITE.url}/og/case${sp.view ? `?view=${encodeURIComponent(sp.view)}` : ""}`;
  const ogImageUrl = override?.image_url ?? settings.case_og_url ?? autoOg;

  const title = override?.title ?? "The J6 Case";
  const description = override?.description ?? CASE_DESCRIPTION;
  const fullTitle = override?.title ?? CASE_TITLE;
  const canonicalUrl = `${SITE.url}${canonical}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: fullTitle,
      description,
      url: canonicalUrl,
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
    alternates: { canonical: canonicalUrl },
  };
}

export default async function CasePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; filter?: string; page?: string }>;
}) {
  const { view, q: rawQ, filter: rawFilter, page: rawPage } = await searchParams;
  const q = (rawQ ?? "").trim();
  const page = parsePage(rawPage);

  // THE FRONT DOOR. Clicking "Case" lands on United States v. Nichols —
  // Ryan's full story, the detention record, the whole file. The archive
  // hub (grievances / timeline / people / documents) still lives at
  // ?view=… and is linked from the "Go deeper" grid
  // (components/case/GoDeeper.tsx) at the foot of the profile. This is
  // deliberate: the case page IS his case.
  if (!view && !q) {
    const ryan = await getPersonBySlug(SUBJECT_SLUG);
    if (ryan) {
      // The split reads its two numbers through lib/case.ts, which is
      // per-request memoized, so starting the defendant count here means the
      // split's own await is a cache hit and not a serial round trip. This
      // page no longer pulls every defendant row to display one integer.
      const [evidence, totals, posts] = await Promise.all([
        getDocumentsForPerson(ryan.id),
        getCaseTotals(),
        getPublishedPosts(),
        getJ6DefendantCount(),
      ]);
      // The hero (the day count) is this page's h1; the path split follows
      // the four stat cards as the return rail, without its own headline.
      return (
        <RyanCaseProfile
          person={ryan}
          evidence={evidence}
          totals={totals}
          posts={posts}
          url={`${SITE.url}/case`}
          variant="case"
          rail={<J6PathSplit active="ryan" />}
        />
      );
    }
  }
  const tab = parseTab(view);
  const j6Filter = parseJ6Filter(rawFilter);

  if (shouldRenderJ6Directory(tab)) {
    const [j6Page, j6Counts] = await Promise.all([
      getJ6PeoplePage({ claimStatus: j6Filter, q, page, pageSize: 48 }),
      getJ6ClaimCounts(),
    ]);
    const { clampedPage } = pageDirectory({
      total: j6Page.total,
      page: j6Page.page,
      pageSize: j6Page.pageSize,
    });

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Door 2 is never one-way: the split sits above the directory so
            the way back to the anchor case is the first thing on the page. */}
        <J6PathSplit active="everyone" className="mb-10" />
        <J6DirectoryHeader
          counts={j6Counts}
          j6Filter={j6Filter}
          q={q}
          total={j6Page.total}
        />
        <J6DirectoryTabs j6Filter={j6Filter} />
        <J6DefendantsView
          people={j6Page.people}
          j6Filter={j6Filter}
          q={q}
          totalCount={j6Page.total}
          page={clampedPage}
          pageSize={j6Page.pageSize}
        />
      </div>
    );
  }

  // `tab === "people"` never reaches here (shouldRenderJ6Directory returns
  // above); the getPeople() branch is for a search query, which needs every
  // person to count hits. The trailing getJ6DefendantCount() warms the
  // per-request cache the path split reads from.
  const [grievances, people, events, documents, totals, siteSettings] = await Promise.all([
    getGrievances(),
    q ? getPeople() : getPersonBySlug("ryan-nichols").then((p) => (p ? [p] : [])),
    getEvents(),
    getDocuments(),
    getCaseTotals(),
    getSiteSettings(),
    getJ6DefendantCount(),
    // J6Banner's own number. Warmed here so the banner, an async server
    // component in the middle of the header, never suspends during SSR: a
    // banner that suspended got its own late boundary, and hydrating that
    // boundary was the intermittent React #418 on the archive views.
    getJ6DefendantCount("unclaimed"),
  ]);
  const ryan = people.find((p) => p.slug === "ryan-nichols") ?? null;
  const ryanPhoto = siteSettings.avatar_url ?? null;

  const {
    filteredGrievances,
    filteredPeople,
    filteredEvents,
    filteredDocuments,
    totalHits,
    eventsShown,
    peopleShown,
  } = filterArchive({
    q,
    j6Filter,
    grievances,
    people,
    events,
    documents,
    peopleNamed: totals.people,
  });
  const { archivePageCount, archivePage, pageEvents, pageDocuments, archiveShowing } =
    pageArchive({ tab, page, filteredEvents, filteredDocuments });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <ArchiveHeader
        totals={totals}
        eventsShown={eventsShown}
        peopleShown={peopleShown}
        ryan={ryan}
        ryanPhoto={ryanPhoto}
        tab={tab}
        q={q}
        totalHits={totalHits}
      />

      <ArchiveTabs
        tab={tab}
        q={q}
        counts={{
          grievances: filteredGrievances.length,
          timeline: filteredEvents.length,
          people: filteredPeople.length,
          documents: filteredDocuments.length,
        }}
      />

      {/* The pager's links land here, not at the top of the header. */}
      <div id={ARCHIVE_LIST_ID} className="scroll-mt-24">
        {tab === "grievances" && <GrievancesView grievances={filteredGrievances} />}
        {tab === "timeline" && <TimelineView events={pageEvents} />}
        {tab === "documents" && <DocumentsView documents={pageDocuments} />}
      </div>
      <ArchivePager
        tab={tab}
        page={archivePage}
        pageCount={archivePageCount}
        showing={archiveShowing}
        q={q}
      />
    </div>
  );
}
