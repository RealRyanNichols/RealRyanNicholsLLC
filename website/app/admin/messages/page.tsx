import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MessageActions } from "@/components/MessageActions";

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

type Status = "new" | "reviewed" | "replied" | "archived" | "all";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
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

  const { filter } = await searchParams;
  const view: Status =
    filter === "reviewed" ||
    filter === "replied" ||
    filter === "archived" ||
    filter === "all"
      ? (filter as Status)
      : "new";

  let query = supabase
    .from("private_messages")
    .select("id, created_at, display_name, email, phone, subject, message, source_path, status")
    .order("created_at", { ascending: false })
    .limit(100);
  if (view !== "all") {
    query = query.eq("status", view);
  }

  const { data, error } = await query;

  const [
    { count: newCount },
    { count: reviewedCount },
    { count: repliedCount },
    { count: archivedCount },
  ] = await Promise.all([
    supabase
      .from("private_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("private_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "reviewed"),
    supabase
      .from("private_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "replied"),
    supabase
      .from("private_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "archived"),
  ]);

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

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink active={view === "new"} href="/admin/messages?filter=new">
          New ({newCount ?? 0})
        </TabLink>
        <TabLink active={view === "reviewed"} href="/admin/messages?filter=reviewed">
          Reviewed ({reviewedCount ?? 0})
        </TabLink>
        <TabLink active={view === "replied"} href="/admin/messages?filter=replied">
          Replied ({repliedCount ?? 0})
        </TabLink>
        <TabLink active={view === "archived"} href="/admin/messages?filter=archived">
          Archived ({archivedCount ?? 0})
        </TabLink>
        <TabLink active={view === "all"} href="/admin/messages?filter=all">
          All
        </TabLink>
      </nav>

      {error ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          Private message storage is connected, but the inbox query failed:
          <span className="ml-1 font-mono">{error.message}</span>
        </section>
      ) : null}

      <section className="mt-6 space-y-3">
        {messages.length === 0 && !error ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted)]">
            No private messages in this bucket.
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
              <div className="min-w-0 text-left text-xs text-[var(--color-ink-soft)] sm:text-right">
                <p className="font-bold">{message.display_name || "No name"}</p>
                {message.email ? (
                  <p className="break-all font-mono">
                    <a href={`mailto:${message.email}`} className="hover:underline">
                      {message.email}
                    </a>
                  </p>
                ) : null}
                {message.phone ? <p className="font-mono">{message.phone}</p> : null}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {message.message}
            </p>
            <MessageActions id={message.id} currentStatus={message.status} />
          </article>
        ))}
      </section>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          Back to admin dashboard
        </Link>
      </p>
    </article>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-3 py-2.5 -mb-px border-b-2 text-sm font-semibold transition sm:px-4",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
