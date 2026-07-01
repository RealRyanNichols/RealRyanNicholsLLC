import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Admin live read: full thread for one conversation (or just messages after a
// cursor, for polling), plus takeover state + captured contact. Admin-only.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId");
  if (!chatId || !/^[0-9a-fA-F-]{16,40}$/.test(chatId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const after = url.searchParams.get("after");
  const sinceIso =
    after && !Number.isNaN(Date.parse(after))
      ? after
      : new Date(0).toISOString();

  const svc = getSupabaseServiceClient();
  const [{ data: msgs }, { data: sess }] = await Promise.all([
    svc
      .from("chat_messages")
      .select("role, content, from_admin, created_at")
      .eq("session_id", chatId)
      .gt("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .limit(300),
    svc
      .from("chat_sessions")
      .select("human_active, contact_email")
      .eq("id", chatId)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    ok: true,
    human: !!sess?.human_active,
    contact: sess?.contact_email ?? null,
    messages: (msgs ?? []).map((m) => ({
      role: m.role as string,
      content: m.content as string,
      fromAdmin: m.from_admin as boolean,
      at: m.created_at as string,
    })),
  });
}
