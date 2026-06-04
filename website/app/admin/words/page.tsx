import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { topWords, topPhrases, type Counted } from "@/lib/word-frequency";

export const metadata: Metadata = {
  title: "Audience language",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminWordsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/words");
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

  const [{ data: comments }, { data: tips }, { data: messages }] = await Promise.all([
    supabase
      .from("comments")
      .select("body")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3000),
    supabase
      .from("case_tips")
      .select("narrative")
      .order("created_at", { ascending: false })
      .limit(1500),
    supabase
      .from("private_messages")
      .select("message")
      .order("created_at", { ascending: false })
      .limit(1500),
  ]);

  const texts: string[] = [
    ...((comments ?? []) as { body: string | null }[]).map((r) => r.body ?? ""),
    ...((tips ?? []) as { narrative: string | null }[]).map((r) => r.narrative ?? ""),
    ...((messages ?? []) as { message: string | null }[]).map((r) => r.message ?? ""),
  ].filter((t) => t.trim().length > 0);

  const words = topWords(texts, 60);
  const bigrams = topPhrases(texts, 2, 30);
  const trigrams = topPhrases(texts, 3, 20);
  const maxWord = words[0]?.count ?? 1;
  const sourceCount =
    (comments?.length ?? 0) + (tips?.length ?? 0) + (messages?.length ?? 0);

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · brain
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Audience language
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)]">
        The words and phrases your people actually use — mined from{" "}
        <strong>{sourceCount.toLocaleString()}</strong> comments, tips, and
        private messages. Put the top terms in your headlines, your posts, and
        your replies: speak the language they&apos;re already using, and you get
        seen and shared more.
      </p>

      {texts.length === 0 ? (
        <p className="mt-10 text-sm italic text-[var(--color-muted)]">
          No audience text yet. As comments, tips, and messages come in, this
          fills itself in.
        </p>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
            <h2 className="text-lg font-bold tracking-tight">
              Top words{" "}
              <span className="text-xs font-medium text-[var(--color-muted)]">
                (sized by how often they&apos;re said)
              </span>
            </h2>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {words.map((w) => {
                const scale = 0.85 + (w.count / maxWord) * 1.6;
                const opacity = 0.5 + (w.count / maxWord) * 0.5;
                return (
                  <span
                    key={w.term}
                    title={`${w.count.toLocaleString()}×`}
                    className="font-black leading-tight text-[var(--color-ink)]"
                    style={{ fontSize: `${scale}rem`, opacity }}
                  >
                    {w.term}
                  </span>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <PhraseList title="Top two-word phrases" items={bigrams} />
            <PhraseList title="Top three-word phrases" items={trigrams} />
          </div>
        </>
      )}

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin
        </Link>{" "}
        ·{" "}
        <Link href="/admin/analytics" className="underline">
          Analytics
        </Link>
      </p>
    </article>
  );
}

function PhraseList({ title, items }: { title: string; items: Counted[] }) {
  const max = items[0]?.count ?? 1;
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm italic text-[var(--color-muted)]">
          Not enough repeated phrases yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.map((p) => (
            <li key={p.term} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-[var(--color-muted)]">
                {p.count}
              </span>
              <span className="relative block flex-1 overflow-hidden rounded">
                <span
                  className="absolute inset-y-0 left-0 rounded bg-[var(--color-accent)]/15"
                  style={{ width: `${Math.max(6, (p.count / max) * 100)}%` }}
                  aria-hidden
                />
                <span className="relative block px-2 py-1 text-sm font-medium text-[var(--color-ink)]">
                  {p.term}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
