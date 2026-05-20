import { getSupabaseStaticClient } from "@/lib/supabase/static";

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
};

export type CasePerson = {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  agency: string | null;
  description: string | null;
};

export type CaseEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
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
};

export async function getGrievances(): Promise<CaseGrievance[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_grievances")
    .select("id, slug, title, summary, body, category, severity, count, display_order")
    .eq("visibility", "public")
    .order("display_order", { ascending: true });
  return (data ?? []) as CaseGrievance[];
}

export async function getGrievanceBySlug(slug: string): Promise<CaseGrievance | null> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_grievances")
    .select("id, slug, title, summary, body, category, severity, count, display_order")
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return (data ?? null) as CaseGrievance | null;
}

export async function getPeople(): Promise<CasePerson[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_people")
    .select("id, slug, name, role, agency, description")
    .eq("visibility", "public")
    .order("name", { ascending: true });
  return (data ?? []) as CasePerson[];
}

export async function getEvents(): Promise<CaseEvent[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_events")
    .select("id, slug, title, description, event_date, location")
    .eq("visibility", "public")
    .order("event_date", { ascending: true });
  return (data ?? []) as CaseEvent[];
}

export async function getDocuments(): Promise<CaseDocument[]> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_documents")
    .select("id, slug, title, description, doc_type, document_date, file_url, external_url, source")
    .eq("visibility", "public")
    .order("document_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as CaseDocument[];
}
