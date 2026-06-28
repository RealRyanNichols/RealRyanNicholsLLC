import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Conversations",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  visitor_id: string | null;
  direction: string | null;
  source: string | null;
  path: string | null;
  message_count: number | null;
  started_at: string;
  last_at: string;
};

type MsgRow = {
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

const DIRECTION_LABELS: Record<string, string> = {
  story: "My story & life",
  case: "The J6 case & record",
  work: "Work with Ryan",
  j6_defendant: "J6 defendant / family",
};

const SOURCE_LABELS: Record<string, string> = {
  x: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  google: "Google search",
  ai: "AI recommended",
  business: "Business / work",
  word_of_mouth: "Word of mouth",
  other: "Other",
};

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
      "id, visitor_id, direction, source, path, message_count, started_at, last_at",
    )
    .order("last_at", { ascending: false })
    .limit(100);
  const sessions = (sessionData ?? []) as SessionRow[];

  const ids = sessions.map((s) => s.id);
  let messages: MsgRow[] = [];
  if (ids.length > 0) {
    const { data: msgData } = await svc
      .from("chat_messages")
      .select("session_id, role, content, created_at")
      .in("session_id", ids)
      .order("created_at", { ascending: true });
    messages = (msgData ?? []) as MsgRow[];
  }
  const bySession = new Map<string, MsgRow[]>();
  for (const m of messages) {
    const arr = bySession.get(m.session_id) ?? [];
    arr.push(m);
    bySession.set(m.session_id, arr);
  }

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = sessions.filter(
    (s) => new Date(s.last_at).getTime() >= dayAgo,
  ).length;

  return (
    <article className="mx-auto max-w-[70rem] px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        The brain
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Conversations
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Every person who chatted with your AI — what they want, where they came
        from, and exactly what was said. {sessions.length} on file ·{" "}
        {last24} in the last 24h.
      </p>

      {sessions.length === 0 ? (
        <p className="mt-10 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-muted)]">
          No conversations yet. They&apos;ll show up here the moment someone
          chats with you on the site.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {sessions.map((s) => {
            const thread = bySession.get(s.id) ?? [];
            const firstQuestion =
              thread.find((m) => m.role === "user")?.content ??
              "(no message captured)";
            const dirLabel = s.direction
              ? DIRECTION_LABELS[s.direction] ?? s.direction
              : null;
            const srcLabel = s.source
              ? SOURCE_LABELS[s.source] ?? s.source
              : null;
            return (
              <details
                key={s.id}
                className="group rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 open:bg-[var(--color-paper)]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:hidden">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                      {firstQuestion}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)]">
                      {dirLabel ? (
                        <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 font-semibold text-[var(--color-accent)]">
                          {dirLabel}
                        </span>
                      ) : null}
                      {srcLabel ? (
                        <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 font-semibold">
                          via {srcLabel}
                        </span>
                      ) : null}
                      <span>{s.message_count ?? thread.length} messages</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNowStrict(new Date(s.last_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {s.path ? (
                        <span className="font-mono text-[10px]">
                          {s.path}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className="mt-0.5 shrink-0 text-lg leading-none text-[var(--color-accent)] transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>

                <div className="mt-4 space-y-3 border-t border-[var(--color-line)] pt-4">
                  {thread.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)] italic">
                      No messages stored for this session.
                    </p>
                  ) : (
                    thread.map((m, i) =>
                      m.role === "user" ? (
                        <div key={i} className="flex justify-end">
                          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-ink)]">
                            {m.content}
                          </div>
                        </div>
                      ) : (
                        <div key={i} className="flex justify-start">
                          <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-3.5 py-2 text-sm text-[var(--color-ink)]">
                            {m.content}
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </article>
  );
}
