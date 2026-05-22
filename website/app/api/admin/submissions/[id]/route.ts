import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["approve", "reject", "reset_pending"]),
  notes: z.string().max(4000).nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
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

  const patch: Record<string, unknown> = {};
  if (parsed.data.action === "approve") {
    patch.submission_status = "approved";
    patch.curated_at = new Date().toISOString();
  } else if (parsed.data.action === "reject") {
    patch.submission_status = "rejected";
    patch.archived = true;
    patch.archived_reason = parsed.data.notes?.trim() || "Rejected by admin";
  } else if (parsed.data.action === "reset_pending") {
    patch.submission_status = "pending";
    patch.archived = false;
    patch.archived_reason = null;
  }
  if (parsed.data.notes !== undefined) {
    patch.submission_notes = parsed.data.notes?.trim() || null;
  }

  const { error } = await supabase
    .from("case_documents")
    .update(patch)
    .eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Update failed." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
