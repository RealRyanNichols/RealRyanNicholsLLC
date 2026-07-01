import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { AdminChatConsole } from "@/components/AdminChatConsole";

export const metadata: Metadata = {
  title: "Conversations",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  direction: string | null;
  source: string | null;
  message_count: number | null;
  last_at: string;
  human_active: boolean | null;
  contact_email: string | null;
};

type MsgRow = { session_id: string; content: string };

export default async function AdminChatsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/chats");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  if (!isSupabaseServiceConfigured()) {
    return (
      <article className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Chat storage needs the Supabase service key. Set
          SUPABASE_SERVICE_ROLE_KEY in the environment to read conversations
          here.
        </p>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const { data: sessionData } = await svc
    .from("chat_sessions")
    .select(
      "id, direction, source, message_count, last_at, human_active, contact_email",
    )
    .order("last_at", { ascending: false })
    .limit(100);
  const sessions = (sessionData ?? []) as SessionRow[];

  const ids = sessions.map((s) => s.id);
  let messages: MsgRow[] = [];
  if (ids.length > 0) {
    const { data } = await svc
      .from("chat_messages")
      .select("session_id, content, created_at")
      .in("session_id", ids)
      .eq("role", "user")
      .order("created_at", { ascending: true });
    messages = (data ?? []) as MsgRow[];
  }
  const firstQ = new Map<string, string>();
  for (const m of messages) {
    if (!firstQ.has(m.session_id)) firstQ.set(m.session_id, m.content);
  }

  const summaries = sessions.map((s) => ({
    id: s.id,
    direction: s.direction,
    source: s.source,
    message_count: s.message_count,
    last_at: s.last_at,
    human_active: !!s.human_active,
    contact_email: s.contact_email,
    firstQuestion: firstQ.get(s.id) ?? "(no message yet)",
  }));

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = sessions.filter(
    (s) => new Date(s.last_at).getTime() >= dayAgo,
  ).length;

  return (
    <article className="mx-auto max-w-[78rem] px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        The brain
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Conversations
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Every person who chatted with you — read it, or jump in and talk to them
        live. {sessions.length} on file · {last24} in the last 24h.
      </p>

      <AdminChatConsole sessions={summaries} />
    </article>
  );
}
