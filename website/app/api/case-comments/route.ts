import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  type: z.enum(["grievance", "event"]),
  slug: z.string().min(1).max(200),
  body: z.string().min(1, "Comment cannot be empty.").max(4000, "Comment is too long."),
});

export async function POST(request: Request) {
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

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "You must be signed in to comment." }, { status: 401 });
  }

  const { error } = await supabase.rpc("submit_case_comment", {
    p_type: parsed.data.type,
    p_slug: parsed.data.slug,
    p_body: parsed.data.body.trim(),
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not post comment." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
