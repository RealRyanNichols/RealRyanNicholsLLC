import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const settingsSchema = z.object({
  action: z.literal("save_settings"),
  campaign_title: z.string().min(1).max(120),
  campaign_blurb: z.string().max(2000).optional().or(z.literal("")),
  manual_raised_cents: z.number().int().min(0).max(100_000_000),
  manual_note: z.string().max(2000).optional().or(z.literal("")),
  show_amounts: z.boolean(),
});

const upsertSchema = z.object({
  action: z.literal("upsert_item"),
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(120),
  blurb: z.string().max(500).optional().or(z.literal("")),
  amount_cents: z.number().int().min(0).max(100_000_000),
  cadence: z.enum(["monthly", "one_time"]),
  sort_order: z.number().int().min(0).max(1000),
  is_active: z.boolean(),
});

const deleteSchema = z.object({
  action: z.literal("delete_item"),
  id: z.string().uuid(),
});

const schema = z.discriminatedUnion("action", [settingsSchema, upsertSchema, deleteSchema]);

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
  const body = parsed.data;

  if (body.action === "save_settings") {
    const { error: e } = await supabase.from("funding_settings").upsert(
      {
        id: "default",
        campaign_title: body.campaign_title.trim(),
        campaign_blurb: body.campaign_blurb?.trim() || null,
        manual_raised_cents: body.manual_raised_cents,
        manual_note: body.manual_note?.trim() || null,
        show_amounts: body.show_amounts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (e) return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "upsert_item") {
    const row = {
      label: body.label.trim(),
      blurb: body.blurb?.trim() || null,
      amount_cents: body.amount_cents,
      cadence: body.cadence,
      sort_order: body.sort_order,
      is_active: body.is_active,
      updated_at: new Date().toISOString(),
    };
    const { error: e } = body.id
      ? await supabase.from("funding_line_items").update(row).eq("id", body.id)
      : await supabase.from("funding_line_items").insert(row);
    if (e) return NextResponse.json({ error: "Could not save the line item." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // delete_item
  const { error: e } = await supabase
    .from("funding_line_items")
    .delete()
    .eq("id", body.id);
  if (e) return NextResponse.json({ error: "Could not delete the line item." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
