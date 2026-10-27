import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Private fiber/water reports",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Report = {
  id: string;
  created_at: string;
  town: string;
  county: string | null;
  incident_date: string;
  utility: string | null;
  general_location: string | null;
  knowledge_basis: string;
  observed_details: string;
  heard_details: string;
  notice_context: string | null;
  notice_url: string | null;
  contact_email: string | null;
  contact_permission: boolean;
  status: string;
};

export default async function WaterReportsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/water-reports");
  const { data: admin } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (admin !== true)
    return (
      <article className="mx-auto max-w-xl px-4 py-12">
        <h1>Not authorized</h1>
      </article>
    );
  const { data, error } = await supabase
    .from("water_incident_reports")
    .select(
      "id, created_at, town, county, incident_date, utility, general_location, knowledge_basis, observed_details, heard_details, notice_context, notice_url, contact_email, contact_permission, status",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const reports = (data ?? []) as Report[];
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Private fiber/water reports</h1>
      <p className="mt-3">
        Unverified private leads. No publication consent is granted. This view
        is limited to the100 most recent reports.
      </p>
      {error ? (
        <p role="alert" className="mt-6">
          Private intake is not available. No reports can be shown.
        </p>
      ) : reports.length === 0 ? (
        <p className="mt-6">No reports received.</p>
      ) : null}
      <div className="mt-8 space-y-6">
        {reports.map((report) => (
          <section
            key={report.id}
            className="rounded-xl border border-[var(--color-line)] p-5"
          >
            <h2 className="text-xl font-semibold">
              {report.town}
              {report.county ? `, ${report.county}` : ""}
            </h2>
            <p>
              {report.incident_date} · {report.status} ·{" "}
              {report.knowledge_basis}
            </p>
            <p className="mt-1 text-sm">
              Received{` ${report.created_at}`} · {report.id}
            </p>
            {report.utility ? (
              <p className="mt-3">Utility/contractor: {report.utility}</p>
            ) : null}
            {report.general_location ? (
              <p>General area: {report.general_location}</p>
            ) : null}
            <h3 className="mt-4 font-semibold">Personally observed</h3>
            <p className="whitespace-pre-wrap">
              {report.observed_details || "Not supplied"}
            </p>
            <h3 className="mt-4 font-semibold">Reported by someone else</h3>
            <p className="whitespace-pre-wrap">
              {report.heard_details || "Not supplied"}
            </p>
            {report.notice_context ? (
              <>
                <h3 className="mt-4 font-semibold">Notice/reference</h3>
                <p className="whitespace-pre-wrap">{report.notice_context}</p>
              </>
            ) : null}
            {report.notice_url ? (
              <p className="mt-3 break-all">
                Public notice URL (not fetched): {report.notice_url}
              </p>
            ) : null}
            {report.contact_permission && report.contact_email ? (
              <p className="mt-4">
                Private email follow-up permitted: {report.contact_email}
              </p>
            ) : (
              <p className="mt-4">No private email follow-up permission.</p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
