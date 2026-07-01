import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Visitor-side poll: returns any messages Ryan has typed LIVE (from_admin) for
// this conversation since the given cursor, plus whether he's currently active.
// The client already has its own + the AI's messages locally, so we only send
// the human ones it doesn't have. chatId is an unguessable uuid the visitor owns.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId");
  const after = url.searchParams.get("after");
  if (!chatId || !/^[0-9a-fA-F-]{16,40}$/.test(chatId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ ok: true, human: false, messages: [] });
  }
  try {
    const svc = getSupabaseServiceClient();
    const sinceIso =
      after && !Number.isNaN(Date.parse(after))
        ? after
        : new Date(0).toISOString();
    const [{ data: msgs }, { data: sess }] = await Promise.all([
      svc
        .from("chat_messages")
        .select("content, created_at")
        .eq("session_id", chatId)
        .eq("from_admin", true)
        .gt("created_at", sinceIso)
        .order("created_at", { ascending: true })
        .limit(20),
      svc
        .from("chat_sessions")
        .select("human_active")
        .eq("id", chatId)
        .maybeSingle(),
    ]);
    return NextResponse.json({
      ok: true,
      human: !!sess?.human_active,
      messages: (msgs ?? []).map((m) => ({
        content: m.content as string,
        at: m.created_at as string,
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, human: false, messages: [] });
  }
}
