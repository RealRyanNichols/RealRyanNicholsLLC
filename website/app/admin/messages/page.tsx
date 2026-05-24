import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Private messages",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PrivateMessageRow = {
  id: string;
  created_at: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  source_path: string | null;
  status: string;
};

export default async function AdminMessagesPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/messages");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const { data, error } = await supabase
    .from("private_messages")
    .select("id, created_at, display_name, email, phone, subject, message, source_path, status")
    .order("created_at", { ascending: false })
    .limit(50);

  const messages = (data ?? []) as PrivateMessageRow[];

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · inbox
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Private messages</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
        Public comments stay public for attention. This lane is for contact info,
        sensitive details, evidence leads, and anything that should not be posted
        in the live room.
      </p>

      {error ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          Private message storage is not connected yet. Apply the
          <code className="mx-1">20260524232000_create_live_and_private_messages.sql</code>
          migration in Supabase.
        </section>
      ) : null}

      <section className="mt-6 space-y-3">
        {messages.length === 0 && !error ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted)]">
            No private messages yet.
          </p>
        ) : null}
        {messages.map((message) => (
          <article
            key={message.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  {message.status}
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight">
                  {message.subject || "Private message"}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {formatDistanceToNowStrict(new Date(message.created_at), {
                    addSuffix: true,
                  })}
                  {message.source_path ? ` · ${message.source_path}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-[var(--color-ink-soft)]">
                <p className="font-bold">{message.display_name || "No name"}</p>
                {message.email ? <p className="font-mono">{message.email}</p> : null}
                {message.phone ? <p className="font-mono">{message.phone}</p> : null}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {message.message}
            </p>
          </article>
        ))}
      </section>
    </article>
  );
}
