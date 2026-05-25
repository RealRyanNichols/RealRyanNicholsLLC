import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const schema = z.object({
  id: z.string().uuid(),
  // published → shows on the public Supporters Wall; archived → hidden;
  // started → back to the unreviewed state.
  status: z.enum(["published", "started", "archived"]),
});

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

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
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("support_intents")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not update the note. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
