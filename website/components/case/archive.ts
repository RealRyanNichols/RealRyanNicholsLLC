import type {
  CaseDocument,
  CaseEvent,
  CaseGrievance,
  CasePerson,
  J6ClaimFilter,
} from "@/lib/case";

// The /case archive's non-visual logic: which tab and filter the URL asks
// for, the search filter, and the paging math. app/case/page.tsx composes
// these with the chapter components in components/case/; nothing here
// renders. Moved out of the page file verbatim.

export type Tab = "grievances" | "timeline" | "people" | "documents";
export type J6Filter = J6ClaimFilter;

// The anchors the pager lands on: the archive list under the tab strip,
// and the people directory's list.
export const ARCHIVE_LIST_ID = "archive-list";
export const J6_PROFILE_LIST_ID = "j6-profile-list";

export function parseTab(view: string | undefined): Tab {
  return view === "timeline" || view === "people" || view === "documents"
    ? (view as Tab)
    : "grievances";
}

export function parseJ6Filter(raw: string | undefined): J6Filter {
  return raw === "unclaimed" || raw === "verified" || raw === "pending" ? raw : "all";
}

export function parsePage(raw: string | undefined): number {
  return Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
}

export function shouldRenderJ6Directory(tab: Tab): boolean {
  return tab === "people";
}

function matchesQuery(q: string, ...fields: (string | null | undefined)[]) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => (f ?? "").toLowerCase().includes(needle));
}

// The people directory's page count and the page it actually shows.
export function pageDirectory({
  total,
  page,
  pageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount);
  return { pageCount, clampedPage };
}

// Rows per page on the timeline and documents views.
export const ARCHIVE_PAGE_SIZE = 48;

export function filterArchive({
  q,
  j6Filter,
  grievances,
  people,
  events,
  documents,
  peopleNamed,
}: {
  q: string;
  j6Filter: J6Filter;
  grievances: CaseGrievance[];
  people: CasePerson[];
  events: CaseEvent[];
  documents: CaseDocument[];
  // The public people count from lib/case.ts, shown when nothing is searched.
  peopleNamed: number;
}) {
  const filteredGrievances = q
    ? grievances.filter((g) =>
        matchesQuery(q, g.title, g.summary, g.body, g.category)
      )
    : grievances;
  const filteredPeopleByQ = q
    ? people.filter((p) =>
        matchesQuery(q, p.name, p.role, p.agency, p.description)
      )
    : people;
  const filteredPeople =
    j6Filter === "all"
      ? filteredPeopleByQ
      : filteredPeopleByQ.filter(
          (p) => p.is_j6_defendant && p.claim_status === j6Filter,
        );
  const filteredEvents = q
    ? events.filter((e) =>
        matchesQuery(q, e.title, e.description, e.location)
      )
    : events;
  const filteredDocuments = q
    ? documents.filter((d) =>
        matchesQuery(q, d.title, d.description, d.doc_type, d.source)
      )
    : documents;

  const totalHits = q
    ? filteredGrievances.length +
      filteredPeople.length +
      filteredEvents.length +
      filteredDocuments.length
    : 0;

  // The two small stats in the header: hits while searching, the record's
  // own counts otherwise.
  const eventsShown = q ? filteredEvents.length : events.length;
  const peopleShown = q ? filteredPeople.length : peopleNamed;

  return {
    filteredGrievances,
    filteredPeople,
    filteredEvents,
    filteredDocuments,
    totalHits,
    eventsShown,
    peopleShown,
  };
}

// The timeline and the documents views page their lists. Unpaged, the
// documents view was a 7.6 MB HTML document (every scan on the record in
// one response) and the timeline 1.5 MB: unreadable on a phone and the
// pages where React's hydration raced the parser. 48 per page, the same
// size as the people directory; the grievances view (34 patterns) stays
// whole.
export function pageArchive({
  tab,
  page,
  filteredEvents,
  filteredDocuments,
}: {
  tab: Tab;
  page: number;
  filteredEvents: CaseEvent[];
  filteredDocuments: CaseDocument[];
}) {
  const archiveList =
    tab === "documents" ? filteredDocuments : tab === "timeline" ? filteredEvents : [];
  const archivePageCount = Math.max(1, Math.ceil(archiveList.length / ARCHIVE_PAGE_SIZE));
  const archivePage = Math.min(page, archivePageCount);
  const archiveFrom = (archivePage - 1) * ARCHIVE_PAGE_SIZE;
  const pageEvents = filteredEvents.slice(archiveFrom, archiveFrom + ARCHIVE_PAGE_SIZE);
  const pageDocuments = filteredDocuments.slice(archiveFrom, archiveFrom + ARCHIVE_PAGE_SIZE);
  const archiveShowing =
    archiveList.length === 0
      ? null
      : `${(archiveFrom + 1).toLocaleString("en-US")}–${Math.min(archiveFrom + ARCHIVE_PAGE_SIZE, archiveList.length).toLocaleString("en-US")} of ${archiveList.length.toLocaleString("en-US")}`;
  return { archivePageCount, archivePage, pageEvents, pageDocuments, archiveShowing };
}
