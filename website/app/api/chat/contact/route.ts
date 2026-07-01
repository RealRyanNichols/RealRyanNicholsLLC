import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// A visitor leaves their contact so Ryan can follow up personally — the chat is
// a real direct line, not just a live-only window. Stored on the chat session.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  let body: { chatId?: unknown; email?: unknown; name?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const chatId =
    typeof body.chatId === "string" && /^[0-9a-fA-F-]{16,40}$/.test(body.chatId)
      ? body.chatId
      : null;
  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  if (!chatId || !email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  try {
    const svc = getSupabaseServiceClient();
    await svc
      .from("chat_sessions")
      .update({ contact_email: email, contact_name: name || null })
      .eq("id", chatId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
