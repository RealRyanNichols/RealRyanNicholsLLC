import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Take over a conversation (human_active=true) or hand it back to the AI
// (human_active=false). Admin-only.

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

  let body: { chatId?: unknown; human?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const chatId =
    typeof body.chatId === "string" && /^[0-9a-fA-F-]{16,40}$/.test(body.chatId)
      ? body.chatId
      : null;
  if (!chatId) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }
  const human = body.human === true;

  const svc = getSupabaseServiceClient();
  await svc
    .from("chat_sessions")
    .update({
      human_active: human,
      human_since: human ? new Date().toISOString() : null,
    })
    .eq("id", chatId);
  return NextResponse.json({ ok: true, human });
}
