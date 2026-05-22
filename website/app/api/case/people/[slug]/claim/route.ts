import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  claimant_email: z.string().email("Please enter a valid email."),
  doj_case_number: z.string().max(80).optional().nullable(),
  proof: z
    .string()
    .min(30, "Give Ryan enough to verify you — at least a couple sentences.")
    .max(8000, "Trim it down to the most important pieces."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
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
    return NextResponse.json(
      { error: "Sign in to claim a profile." },
      { status: 401 }
    );
  }

  // Rate limit: 10 claim submissions per hour per IP/user.
  const rl = await checkRateLimit({
    request,
    bucket: "claim",
    windowMinutes: 60,
    maxRequests: 10,
    userId: auth.user.id,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { data: person } = await supabase
    .from("case_people")
    .select("id, name, claim_status, is_j6_defendant")
    .eq("slug", slug)
    .maybeSingle();
  if (!person) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  if (!person.is_j6_defendant) {
    return NextResponse.json(
      { error: "This profile is not claimable." },
      { status: 400 }
    );
  }
  if (person.claim_status === "verified") {
    return NextResponse.json(
      { error: "This profile has already been verified to its owner." },
      { status: 409 }
    );
  }

  // Per the unique constraint on (person_id, claimant_user_id), upsert is the
  // friendliest behavior — if you already submitted, edit your claim.
  const { error } = await supabase.from("case_person_claims").upsert(
    {
      person_id: person.id,
      claimant_user_id: auth.user.id,
      claimant_email: parsed.data.claimant_email.trim(),
      doj_case_number: parsed.data.doj_case_number?.trim() || null,
      proof: parsed.data.proof.trim(),
      status: "pending",
    },
    { onConflict: "person_id,claimant_user_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Could not save your claim. Try again." },
      { status: 500 }
    );
  }

  // Flip the person row to claim_status='pending' so the page hints at activity.
  if (person.claim_status === "unclaimed") {
    await supabase
      .from("case_people")
      .update({
        claim_status: "pending",
        claim_requested_at: new Date().toISOString(),
      })
      .eq("id", person.id);
  }

  return NextResponse.json({ ok: true });
}
