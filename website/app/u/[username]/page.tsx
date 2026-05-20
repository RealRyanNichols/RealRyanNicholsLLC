import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export const revalidate = 60;

async function getProfile(username: string) {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, bio, location, avatar_url, status, verified_at, verified_linked_account, created_at"
    )
    .eq("username", username.toLowerCase())
    .neq("status", "banned")
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Not found", robots: { index: false } };
  const title = profile.display_name ?? `@${profile.username}`;
  return {
    title,
    description: profile.bio ?? `${title}'s profile on ${SITE.name}.`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const verified = !!profile.verified_at || profile.verified_linked_account;
  const isPending = profile.status === "pending";

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/" className="hover:underline">
          ← Back to feed
        </Link>
      </nav>

      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? `@${profile.username}`}
              width={120}
              height={120}
              className="h-24 w-24 rounded-full object-cover flex-shrink-0 ring-2 ring-[var(--color-line)]"
              unoptimized={profile.avatar_url.startsWith("http")}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)] flex items-center justify-center text-2xl font-bold text-[var(--color-ink-soft)] flex-shrink-0">
              {(profile.display_name ?? profile.username ?? "?")
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {profile.display_name ?? `@${profile.username}`}
              </h1>
              {verified ? (
                <span
                  title="Verified"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 border border-emerald-700 px-2 py-0.5 text-xs font-bold text-emerald-300"
                >
                  ✓ Verified
                </span>
              ) : isPending ? (
                <span
                  title="Pending admin review"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-900/30 border border-amber-700 px-2 py-0.5 text-xs font-semibold text-amber-300"
                >
                  Pending review
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-[var(--color-muted)] font-mono">
              @{profile.username}
            </p>

            {profile.bio ? (
              <p className="mt-4 text-sm sm:text-[15px] text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
              {profile.location ? <span>📍 {profile.location}</span> : null}
              <span>
                Joined {format(new Date(profile.created_at), "MMMM yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
