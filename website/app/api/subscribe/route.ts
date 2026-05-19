import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
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
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("notify_signups")
    .insert({ email: parsed.data.email, channel: "email" });

  if (error) {
    return NextResponse.json({ error: "Could not save your email." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
