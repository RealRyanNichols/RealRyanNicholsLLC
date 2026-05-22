import { NextResponse } from "next/server";
import { z } from "zod";
import { requireJ6Owner } from "@/lib/j6-ownership";

const schema = z.object({
  person_id: z.string().uuid(),
  description: z.string().max(50000),
});

export async function POST(request: Request) {
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
  const own = await requireJ6Owner(parsed.data.person_id);
  if (!own.ok) {
    return NextResponse.json({ error: own.error }, { status: own.status });
  }
  const { error } = await own.supabase
    .from("case_people")
    .update({ description: parsed.data.description.trim() || null })
    .eq("id", own.person.id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Could not save." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
