import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { RegenerateButton, VariantActions } from "@/components/SocialStudioActions";

export const metadata: Metadata = {
  title: "Social Studio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Social Studio — every published article gets four platform drafts written
// in Ryan's voice (Facebook, X, Instagram, TikTok). Copy, download, mark
// posted, regenerate. Drafts appear automatically on publish; older posts
// get a Generate button. Nothing here ever posts anywhere by itself.

type PostRow = {
  id: string;
  slug: string;
  title: string | null;
  published_at: string | null;
  type: string;
};

type VariantRow = {
  id: string;
  post_id: string;
  platform: "facebook" | "x" | "instagram" | "tiktok";
  angle: string;
  body: string;
  status: string;
  created_at: string;
};

const PLATFORM_ORDER: VariantRow["platform"][] = ["x", "facebook", "instagram", "tiktok"];
const PLATFORM_NAMES: Record<VariantRow["platform"], string> = {
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok script",
};

export default async function AdminSocialPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/social");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  if (!isSupabaseServiceConfigured()) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-7">
        <h1 className="text-3xl font-bold tracking-tight">Social Studio</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Service role is not configured, so drafts cannot be read here.
        </p>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const [{ data: posts }, { data: variants }] = await Promise.all([
    svc
      .from("posts")
      .select("id, slug, title, published_at, type")
      .eq("status", "published")
      .in("type", ["text", "note"])
      .order("published_at", { ascending: false })
      .limit(20),
    svc
      .from("social_studio_posts")
      .select("id, post_id, platform, angle, body, status, created_at")
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  const allPosts = (posts ?? []) as PostRow[];
  const byPost = new Map<string, VariantRow[]>();
  for (const v of (variants ?? []) as VariantRow[]) {
    const list = byPost.get(v.post_id) ?? [];
    list.push(v);
    byPost.set(v.post_id, list);
  }

  const anthropicOn = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <article className="mx-auto max-w-3xl px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · Social Studio
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Write once. Post everywhere.
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Every published article gets four drafts in your voice: X, Facebook,
        Instagram, TikTok. Copy what works, regenerate what does not, mark what
        you posted. New articles fill in automatically on publish.
      </p>

      {!anthropicOn ? (
        <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-[var(--color-ink)]">
          ANTHROPIC_API_KEY is not set in Vercel, so generation is off. Drafts
          already written still show below.
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {allPosts.map((p) => {
          const drafts = (byPost.get(p.id) ?? []).sort(
            (a, b) =>
              PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform),
          );
          return (
            <section
              key={p.id}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/posts/${p.slug}`}
                    className="block truncate text-base font-black text-[var(--color-ink)] hover:underline"
                  >
                    {p.title ?? p.slug}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {p.published_at
                      ? `Published ${formatDistanceToNowStrict(new Date(p.published_at), { addSuffix: true })}`
                      : "Published"}
                    {drafts.length > 0 ? ` · ${drafts.length} drafts` : ""}
                  </p>
                </div>
                <RegenerateButton postId={p.id} />
              </div>

              {drafts.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  {drafts.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3.5"
                    >
                      <p className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[var(--color-navy)]">
                        {PLATFORM_NAMES[v.platform]}
                        {v.angle ? (
                          <span className="rounded bg-[var(--color-blue-soft)] px-1.5 py-0.5 text-[10px] text-[var(--color-blue)]">
                            {v.angle}
                          </span>
                        ) : null}
                        {v.platform === "x" ? (
                          <span className="font-mono text-[10px] font-bold normal-case text-[var(--color-muted)]">
                            {v.body.length} chars
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]">
                        {v.body}
                      </p>
                      <VariantActions
                        id={v.id}
                        platform={v.platform}
                        postSlug={p.slug}
                        body={v.body}
                        status={v.status}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-[var(--color-muted)]">
                  No drafts yet. Hit Generate drafts.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}
