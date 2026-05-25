import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-guard";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().uuid(),
  fulfilled: z.boolean().default(true),
});

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
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
      { status: 400 },
    );
  }

  const svc = getSupabaseServiceClient();
  const { error } = await svc
    .from("orders")
    .update({
      status: parsed.data.fulfilled ? "fulfilled" : "paid",
      fulfilled_at: parsed.data.fulfilled ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
