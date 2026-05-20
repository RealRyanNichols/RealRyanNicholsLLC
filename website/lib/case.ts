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
  event_date: string;
  location: string | null;
  views_count: number;
  shares_count: number;
};

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
};

const GRIEVANCE_COLS =
  "id, slug, title, summary, body, category, severity, count, display_order, views_count, shares_count";
const PERSON_COLS =
  "id, slug, name, role, agency, description, photo_url, views_count, shares_count";
const EVENT_COLS =
  "id, slug, title, description, event_date, location, views_count, shares_count";
const DOCUMENT_COLS =
  "id, slug, title, description, doc_type, document_date, file_url, external_url, source, views_count, shares_count, archived, relevance, transcript";

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
    .order("event_date", { ascending: true });
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
