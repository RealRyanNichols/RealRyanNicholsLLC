import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileEditor } from "@/components/ProfileEditor";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, full_name, username, bio, location, avatar_url, status, verified_at, verified_linked_account"
    )
    .eq("id", data.user.id)
    .maybeSingle();

  const isPending = profile?.status === "pending";
  const isBanned = profile?.status === "banned";
  const isVerified = !!profile?.verified_at || profile?.verified_linked_account;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight">Your account</h1>
      <p className="text-[var(--color-ink-soft)] mt-2 text-sm">
        Signed in as <span className="font-mono">{data.user.email}</span>.
      </p>

      {isBanned ? (
        <div className="mt-6 rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          This account is banned. Contact the site admin if you think this is in error.
        </div>
      ) : isPending ? (
        <div className="mt-6 rounded-xl border border-amber-700 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          <strong>Pending review.</strong> An admin will verify your real name before your
          comments are visible publicly. Fill out your profile below to speed it up.
        </div>
      ) : isVerified ? (
        <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          ✓ Verified account.
        </div>
      ) : null}

      {profile?.username ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Public profile: <Link href={`/u/${profile.username}`} className="text-[var(--color-accent)] underline">/u/{profile.username}</Link>
        </p>
      ) : null}

      <div className="mt-8">
        <ProfileEditor
          initial={{
            id: data.user.id,
            display_name: profile?.display_name ?? "",
            full_name: profile?.full_name ?? "",
            username: profile?.username ?? "",
            bio: profile?.bio ?? "",
            location: profile?.location ?? "",
          }}
        />
      </div>

      <div className="mt-8 flex items-center gap-4">
        <Link href="/" className="text-sm underline text-[var(--color-ink-soft)]">
          ← Back to feed
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
