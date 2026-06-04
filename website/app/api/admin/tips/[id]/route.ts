import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["pending", "reviewed", "merged", "rejected"]),
  reviewed_notes: z.string().max(4000).nullable().optional(),
  outcome_status: z
    .enum([
      "unworked",
      "article_draft",
      "article_published",
      "solution_brief",
      "case_mapped",
      "evidence_verified",
      "private_reply",
      "service_lead",
      "invoice_sent",
      "watch_file",
      "closed",
    ])
    .optional(),
  outcome_url: z.string().url().max(1000).nullable().optional().or(z.literal("")),
  outcome_notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const outcomeStatus = parsed.data.outcome_status;
  const outcomeUrl =
    parsed.data.outcome_url === "" ? null : parsed.data.outcome_url;
  const outcomeChanged = outcomeStatus !== undefined;
  const { error } = await supabase
    .from("case_tips")
    .update({
      status: parsed.data.status,
      reviewed_notes:
        parsed.data.reviewed_notes === undefined
          ? undefined
          : parsed.data.reviewed_notes,
      outcome_status: outcomeStatus,
      outcome_url: outcomeUrl,
      outcome_notes:
        parsed.data.outcome_notes === undefined
          ? undefined
          : parsed.data.outcome_notes,
      outcome_at: outcomeChanged ? new Date().toISOString() : undefined,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Could not update tip." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
