import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required.")
    .max(120, "Full name is too long.")
    .refine((v) => v.trim().split(/\s+/).length >= 2, {
      message: "Use your real first AND last name.",
    }),
  display_name: z.string().min(1, "Display name is required.").max(60),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9][a-z0-9_-]{2,29}$/,
      "3–30 chars, lowercase letters/numbers/dash/underscore, can't start with a dash.",
    ),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
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

  const full_name = parsed.data.full_name.trim();
  const display_name = parsed.data.display_name.trim();
  const username = parsed.data.username.trim().toLowerCase();

  // Check username availability (case-insensitive collision)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .neq("id", auth.user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: `That username is taken. Try another.` },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: auth.user.id,
        full_name,
        display_name,
        username,
        // Set status to pending so an admin still has to verify the real
        // name before unlocking comments/claims (same gate the signup
        // path uses).
        status: "pending",
      },
      { onConflict: "id" },
    );
  if (error) {
    if (/duplicate/i.test(error.message) && /username/i.test(error.message)) {
      return NextResponse.json(
        { error: "That username is taken. Try another." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `Could not save profile: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
