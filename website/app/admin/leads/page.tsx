import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  x: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  google: "Google",
  ai: "AI recommended",
  business: "Business",
  word_of_mouth: "Word of mouth",
  other: "Other",
};

type Item = {
  when: string;
  email: string | null;
  name: string | null;
  source: string | null;
  detail: string;
  kind: "Quiz" | "Chat" | "Email";
};

function label(src: string | null): string | null {
  if (!src) return null;
  return SOURCE_LABELS[src] ?? src;
}

export default async function AdminLeadsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/leads");
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
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Lead storage needs the Supabase service key.
        </p>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const [{ data: leads }, { data: signups }, { data: chats }] = await Promise.all([
    svc
      .from("leads")
      .select(
        "email, name, source, political_affiliation, good_day, reason, last_seen",
      )
      .order("last_seen", { ascending: false })
      .limit(300),
    svc
      .from("notify_signups")
      .select("email, created_at, confirmed_at")
      .eq("channel", "email")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(300),
    svc
      .from("chat_sessions")
      .select("contact_email, contact_name, source, direction, last_at")
      .not("contact_email", "is", null)
      .order("last_at", { ascending: false })
      .limit(300),
  ]);

  const items: Item[] = [];
  for (const l of (leads ?? []) as Record<string, unknown>[]) {
    const bits = [l.good_day, l.reason, l.political_affiliation]
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .join(" · ");
    items.push({
      when: l.last_seen as string,
      email: (l.email as string) ?? null,
      name: (l.name as string) ?? null,
      source: (l.source as string) ?? null,
      detail: bits || "took the quiz",
      kind: "Quiz",
    });
  }
  for (const s of (signups ?? []) as Record<string, unknown>[]) {
    items.push({
      when: s.created_at as string,
      email: (s.email as string) ?? null,
      name: null,
      source: null,
      detail: s.confirmed_at ? "confirmed subscriber" : "pending confirm",
      kind: "Email",
    });
  }
  for (const c of (chats ?? []) as Record<string, unknown>[]) {
    items.push({
      when: c.last_at as string,
      email: (c.contact_email as string) ?? null,
      name: (c.contact_name as string) ?? null,
      source: (c.source as string) ?? null,
      detail:
        typeof c.direction === "string" && c.direction
          ? `here for ${c.direction}`
          : "left contact in chat",
      kind: "Chat",
    });
  }
  items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = items.filter((i) => new Date(i.when).getTime() >= dayAgo).length;

  return (
    <article className="mx-auto max-w-[78rem] px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        The brain · leads
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Leads
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Everyone who left you something — quiz answers, an email, contact in
        chat. {items.length} on file · {last24} in the last 24h. This is who you
        can follow up with and sell to.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-muted)]">
          No leads yet. They&apos;ll show up here as people take the quiz, leave
          an email, or drop their contact in the chat.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-line)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[var(--color-surface)] text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-2 text-left">Who</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">What they told you</th>
                <th className="px-4 py-2 text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr
                  key={i}
                  className="border-t border-[var(--color-line)] align-top"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-[var(--color-ink)]">
                      {it.name || (it.email ? it.email.split("@")[0] : "Anonymous")}
                    </div>
                    {it.email ? (
                      <div className="text-xs text-[var(--color-ink-soft)]">
                        {it.email}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--color-muted)] italic">
                        no email yet
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-ink-soft)]">
                      {it.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                    {label(it.source) ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                    {it.detail}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap text-xs text-[var(--color-muted)]">
                    {formatDistanceToNowStrict(new Date(it.when), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
