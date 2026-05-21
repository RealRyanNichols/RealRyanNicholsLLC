import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(4000).nullable().optional(),
});

export async function POST(
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

  if (parsed.data.action === "approve") {
    const { error } = await supabase.rpc("approve_person_claim", {
      p_claim_id: id,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message || "Could not approve." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  // reject
  const { error } = await supabase
    .from("case_person_claims")
    .update({
      status: "rejected",
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
      reviewed_notes: parsed.data.notes?.trim() || null,
    })
    .eq("id", id)
    .eq("status", "pending");
  if (error) {
    return NextResponse.json(
      { error: "Could not reject claim." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
