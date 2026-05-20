import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CaseEntityType = "grievance" | "event" | "document" | "person";
export type CaseCommentableType = "grievance" | "event";

export type CaseGrievance = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  severity: number;
  count: number;
  display_order: number;
  views_count: number;
  shares_count: number;
};

export type CasePerson = {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  agency: string | null;
  description: string | null;
  photo_url: string | null;
  views_count: number;
  shares_count: number;
};

export type CaseEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  views_count: number;
  shares_count: number;
};

export type CaseAuthorRole =
  | "ryan"
  | "co_detainee"
  | "attorney"
  | "court"
  | "government"
  | "family"
  | "media"
  | "evidence"
  | "other";

export type CaseDocument = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  doc_type: string;
  document_date: string | null;
  file_url: string | null;
  external_url: string | null;
  source: string | null;
  views_count: number;
  shares_count: number;
  archived: boolean;
  relevance: number;
  transcript: string | null;
  author_role: CaseAuthorRole;
  series_lead_slug: string | null;
  series_position: number;
  series_title: string | null;
};

const GRIEVANCE_COLS =
  "id, slug, title, summary, body, category, severity, count, display_order, views_count, shares_count";
const PERSON_COLS =
  "id, slug, name, role, agency, description, photo_url, views_count, shares_count";
const EVENT_COLS =
  "id, slug, title, description, event_date, location, views_count, shares_count";
const DOCUMENT_COLS =
  "id, slug, title, description, doc_type, document_date, file_url, external_url, source, views_count, shares_count, archived, relevance, transcript, author_role, series_lead_slug, series_position, series_title";

// Authorship ordering — Ryan's own paperwork is priority #1, corroborating
// witness statements from fellow detainees are priority #2, everything else
// follows. Implemented as a CASE expression in SQL since enums don't sort
// in priority order naturally.
const AUTHOR_PRIORITY_ORDER = "(case author_role"
  + " when 'ryan' then 0"
  + " when 'co_detainee' then 1"
  + " when 'attorney' then 2"
  + " when 'court' then 3"
  + " when 'government' then 4"
  + " when 'evidence' then 5"
  + " when 'family' then 6"
  + " when 'media' then 7"
  + " else 8 end)";

export async function getGrievances(): Promise<CaseGrievance[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_grievances")
    .select(GRIEVANCE_COLS)
    .eq("visibility", "public")
    .order("display_order", { ascending: true });
  return (data ?? []) as CaseGrievance[];
}

export async function getGrievanceBySlug(slug: string): Promise<CaseGrievance | null> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_grievances")
    .select(GRIEVANCE_COLS)
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return (data ?? null) as CaseGrievance | null;
}

export async function getPeople(): Promise<CasePerson[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_people")
    .select(PERSON_COLS)
    .eq("visibility", "public")
    .order("name", { ascending: true });
  return (data ?? []) as CasePerson[];
}

export async function getPersonBySlug(slug: string): Promise<CasePerson | null> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_people")
    .select(PERSON_COLS)
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return (data ?? null) as CasePerson | null;
}

export async function getEvents(): Promise<CaseEvent[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_events")
    .select(EVENT_COLS)
    .eq("visibility", "public")
    .order("event_date", { ascending: true, nullsFirst: true });
  return (data ?? []) as CaseEvent[];
}

export async function getEventBySlug(slug: string): Promise<CaseEvent | null> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_events")
    .select(EVENT_COLS)
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return (data ?? null) as CaseEvent | null;
}

export async function getDocuments(): Promise<CaseDocument[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_documents")
    .select(DOCUMENT_COLS)
    .eq("visibility", "public")
    .eq("archived", false)
    .order("document_date", { ascending: false, nullsFirst: false })
    .order("relevance", { ascending: false })
    .order("title", { ascending: true });
  return (data ?? []) as CaseDocument[];
}

// Sort evidence so Ryan's own paperwork shows first, then corroborating
// witnesses, then court/government documents.
function rankByAuthorRole(role: CaseAuthorRole): number {
  switch (role) {
    case "ryan": return 0;
    case "co_detainee": return 1;
    case "attorney": return 2;
    case "court": return 3;
    case "government": return 4;
    case "evidence": return 5;
    case "family": return 6;
    case "media": return 7;
    default: return 8;
  }
}

function sortEvidenceForCaseEntity(docs: CaseDocument[]): CaseDocument[] {
  return [...docs].sort((a, b) => {
    const ra = rankByAuthorRole(a.author_role);
    const rb = rankByAuthorRole(b.author_role);
    if (ra !== rb) return ra - rb;
    if (a.document_date && b.document_date) {
      return b.document_date.localeCompare(a.document_date);
    }
    if (a.document_date) return -1;
    if (b.document_date) return 1;
    return (b.relevance ?? 0) - (a.relevance ?? 0);
  });
}

export async function getAllDocumentsForAdmin(): Promise<CaseDocument[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("case_documents")
    .select(DOCUMENT_COLS)
    .order("document_date", { ascending: false, nullsFirst: false })
    .order("slug", { ascending: true });
  return (data ?? []) as CaseDocument[];
}

export async function getDocumentBySlug(slug: string): Promise<CaseDocument | null> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_documents")
    .select(DOCUMENT_COLS)
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return (data ?? null) as CaseDocument | null;
}

export async function getCaseCommentsCount(
  type: CaseCommentableType,
  id: string,
): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { count } = await supabase
    .from("case_comments")
    .select("id", { count: "exact", head: true })
    .eq("commentable_type", type)
    .eq("commentable_id", id)
    .eq("status", "approved");
  return count ?? 0;
}

export async function getDocumentsForGrievance(grievanceId: string): Promise<CaseDocument[]> {
  const supabase = getSupabaseStaticClient();
  const { data: links } = await supabase
    .from("case_doc_grievance")
    .select("document_id")
    .eq("grievance_id", grievanceId);
  const ids = (links ?? []).map((l) => l.document_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("case_documents")
    .select(DOCUMENT_COLS)
    .in("id", ids)
    .eq("visibility", "public")
    .eq("archived", false);
  return sortEvidenceForCaseEntity((data ?? []) as CaseDocument[]);
}

export async function getDocumentsForEvent(eventId: string): Promise<CaseDocument[]> {
  const supabase = getSupabaseStaticClient();
  const { data: links } = await supabase
    .from("case_doc_event")
    .select("document_id")
    .eq("event_id", eventId);
  const ids = (links ?? []).map((l) => l.document_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("case_documents")
    .select(DOCUMENT_COLS)
    .in("id", ids)
    .eq("visibility", "public")
    .eq("archived", false);
  return sortEvidenceForCaseEntity((data ?? []) as CaseDocument[]);
}

export async function getDocumentsForPerson(personId: string): Promise<CaseDocument[]> {
  const supabase = getSupabaseStaticClient();
  const { data: links } = await supabase
    .from("case_doc_person")
    .select("document_id")
    .eq("person_id", personId);
  const ids = (links ?? []).map((l) => l.document_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("case_documents")
    .select(DOCUMENT_COLS)
    .in("id", ids)
    .eq("visibility", "public")
    .eq("archived", false);
  return sortEvidenceForCaseEntity((data ?? []) as CaseDocument[]);
}
