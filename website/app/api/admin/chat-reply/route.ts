import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Ryan sends a LIVE reply into a conversation. Admin-only. Sending a reply also
// flips the session to human_active — so the AI stands down for that visitor.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (isAdmin !== true) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ ok: false, error: "no_service" }, { status: 503 });
  }

  let body: { chatId?: unknown; content?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const chatId =
    typeof body.chatId === "string" && /^[0-9a-fA-F-]{16,40}$/.test(body.chatId)
      ? body.chatId
      : null;
  const content =
    typeof body.content === "string" ? body.content.trim().slice(0, 4000) : "";
  if (!chatId || !content) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  const svc = getSupabaseServiceClient();
  const nowIso = new Date().toISOString();
  await svc.from("chat_messages").insert({
    session_id: chatId,
    role: "assistant",
    content,
    from_admin: true,
  });
  await svc
    .from("chat_sessions")
    .update({ human_active: true, human_since: nowIso, last_at: nowIso })
    .eq("id", chatId);
  return NextResponse.json({ ok: true });
}
